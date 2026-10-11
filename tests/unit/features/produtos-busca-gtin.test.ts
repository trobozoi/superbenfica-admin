import { afterEach, describe, expect, it, vi } from "vitest";
import { buscarProdutoPorGtin, nomeOpenFoodFacts } from "@/features/produtos/busca-gtin";
import { FOTO_MAX_BYTES } from "@/features/produtos/foto";

const GTIN = "7891000100103";

const OFF_MOCA = {
  code: GTIN,
  status: 1,
  product: {
    product_name: "Leite Condensado Integral moça",
    product_name_pt: "Leite Condensado Integral moça",
    quantity: "395 g",
  },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function imagem(status = 200, type = "image/png", bytes = 100) {
  return new Response(status === 200 ? new Uint8Array(bytes) : null, {
    status,
    headers: status === 200 ? { "Content-Type": type } : {},
  });
}

/** Responde o Open Food Facts e a rota de foto do BFF com respostas diferentes. */
function mockFetch(
  nome: () => Response | Promise<Response>,
  foto: () => Response | Promise<Response>,
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    return Promise.resolve(url.startsWith("/api/gtin/") ? foto() : nome());
  });
}

describe("nomeOpenFoodFacts", () => {
  it("usa o nome em português e acrescenta a quantidade", () => {
    expect(nomeOpenFoodFacts(OFF_MOCA)).toBe("Leite Condensado Integral moça 395 g");
    expect(nomeOpenFoodFacts({ product: { product_name: "Arroz", quantity: "" } })).toBe("Arroz");
  });

  it("não repete a quantidade que já está no nome e limita a 150 caracteres", () => {
    expect(nomeOpenFoodFacts({ product: { product_name: "Café 500g", quantity: "500G" } })).toBe(
      "Café 500g",
    );
    expect(nomeOpenFoodFacts({ product: { product_name: "x".repeat(200) } })).toHaveLength(150);
  });

  it("devolve null sem nome", () => {
    expect(nomeOpenFoodFacts({ status: 0 })).toBeNull();
    expect(nomeOpenFoodFacts({ product: { product_name: "  " } })).toBeNull();
  });
});

describe("buscarProdutoPorGtin", () => {
  afterEach(() => vi.restoreAllMocks());

  it("busca o nome no Open Food Facts e a foto pelo BFF", async () => {
    const fetchSpy = mockFetch(
      () => json(200, OFF_MOCA),
      () => imagem(),
    );
    const result = await buscarProdutoPorGtin(` ${GTIN} `);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`https://world.openfoodfacts.org/api/v2/product/${GTIN}.json`),
      expect.anything(),
    );
    expect(fetchSpy).toHaveBeenCalledWith(`/api/gtin/${GTIN}/foto`, expect.anything());
    expect(result.status).toBe("found");
    if (result.status !== "found") return;
    expect(result.produto.nome).toBe("Leite Condensado Integral moça 395 g");
    expect(result.produto.foto).toBeInstanceOf(File);
    expect(result.produto.foto?.name).toBe(`${GTIN}.png`);
    expect(result.produto.foto?.type).toBe("image/png");
  });

  it("aproveita o que encontrou quando uma das fontes falha", async () => {
    mockFetch(
      () => Promise.reject(new TypeError("rede")),
      () => imagem(),
    );
    const result = await buscarProdutoPorGtin(GTIN);
    expect(result).toMatchObject({ status: "found", produto: { nome: null } });

    vi.restoreAllMocks();
    mockFetch(
      () => json(200, OFF_MOCA),
      () => imagem(503),
    );
    await expect(buscarProdutoPorGtin(GTIN)).resolves.toMatchObject({
      status: "found",
      produto: { foto: null },
    });
  });

  it("descarta foto em formato não aceito ou grande demais", async () => {
    mockFetch(
      () => json(200, OFF_MOCA),
      () => imagem(200, "image/gif"),
    );
    await expect(buscarProdutoPorGtin(GTIN)).resolves.toMatchObject({ produto: { foto: null } });

    vi.restoreAllMocks();
    mockFetch(
      () => json(200, OFF_MOCA),
      () => imagem(200, "image/png", FOTO_MAX_BYTES + 1),
    );
    await expect(buscarProdutoPorGtin(GTIN)).resolves.toMatchObject({ produto: { foto: null } });
  });

  it("diferencia produto inexistente de falha nas duas fontes", async () => {
    mockFetch(
      () => json(404, { status: 0 }),
      () => imagem(404),
    );
    await expect(buscarProdutoPorGtin(GTIN)).resolves.toEqual({ status: "not_found" });

    vi.restoreAllMocks();
    mockFetch(
      () => json(500, {}),
      () => imagem(503),
    );
    await expect(buscarProdutoPorGtin(GTIN)).resolves.toEqual({ status: "error" });
  });

  it("não consulta nada com código inválido", async () => {
    const fetchSpy = mockFetch(
      () => json(200, OFF_MOCA),
      () => imagem(),
    );
    await expect(buscarProdutoPorGtin("7891000100104")).resolves.toEqual({ status: "invalid" });
    await expect(buscarProdutoPorGtin("123")).resolves.toEqual({ status: "invalid" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
