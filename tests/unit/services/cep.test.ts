import { afterEach, describe, expect, it, vi } from "vitest";
import { cepDigits, formatCep, isCompleteCep, lookupCep, mapViaCep } from "@/services/cep";

const VIACEP_SE = {
  cep: "01001-000",
  logradouro: "Praça da Sé",
  complemento: "lado ímpar",
  unidade: "",
  bairro: "Sé",
  localidade: "São Paulo",
  uf: "SP",
  estado: "São Paulo",
  regiao: "Sudeste",
  ibge: "3550308",
  gia: "1004",
  ddd: "11",
  siafi: "7107",
};

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("services/cep", () => {
  afterEach(() => vi.restoreAllMocks());

  it("aplica a máscara 00000-000 e limita a 8 dígitos", () => {
    expect(formatCep("01001")).toBe("01001");
    expect(formatCep("01001000")).toBe("01001-000");
    expect(formatCep("01.001-0009")).toBe("01001-000");
    expect(cepDigits("60020-181")).toBe("60020181");
    expect(isCompleteCep("60020-18")).toBe(false);
    expect(isCompleteCep("60020181")).toBe(true);
  });

  it("converte o JSON do ViaCEP para os campos da API", () => {
    expect(mapViaCep(VIACEP_SE)).toEqual({
      cep: "01001-000",
      endereco: "Praça da Sé",
      bairro: "Sé",
      cidade: "São Paulo",
      estado: "SP",
      faixa: "lado ímpar",
    });
    expect(mapViaCep({ uf: "XX" }).estado).toBe("");
  });

  it("consulta a URL do ViaCEP só com dígitos", async () => {
    const fetchSpy = mockFetch(200, VIACEP_SE);
    const result = await lookupCep("01001-000");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01001000/json/",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(result).toMatchObject({ status: "found", address: { cidade: "São Paulo" } });
  });

  it("trata CEP inexistente, formato inválido e falhas sem lançar exceção", async () => {
    mockFetch(200, { erro: "true" });
    await expect(lookupCep("99999999")).resolves.toEqual({ status: "not_found" });

    vi.restoreAllMocks();
    mockFetch(400, {});
    await expect(lookupCep("00000000")).resolves.toEqual({ status: "invalid" });

    vi.restoreAllMocks();
    mockFetch(503, {});
    await expect(lookupCep("01001000")).resolves.toEqual({ status: "error" });

    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("rede"));
    await expect(lookupCep("01001000")).resolves.toEqual({ status: "error" });
  });

  it("não chama a API com CEP incompleto e repassa o sinal de cancelamento", async () => {
    const fetchSpy = mockFetch(200, VIACEP_SE);
    await expect(lookupCep("0100")).resolves.toEqual({ status: "invalid" });
    expect(fetchSpy).not.toHaveBeenCalled();

    const controller = new AbortController();
    await lookupCep("01001000", controller.signal);
    expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
