import { afterEach, describe, expect, it, vi } from "vitest";
import { FOTO_MAX_BYTES, validarFoto } from "@/features/produtos/foto";
import { mediaSrc } from "@/lib/media";
import { produtosApi } from "@/services/api";
import { http } from "@/services/http/client";

describe("validarFoto", () => {
  it("aceita JPEG, PNG e WebP até 2 MB", () => {
    expect(validarFoto({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validarFoto({ type: "image/png", size: FOTO_MAX_BYTES })).toBeNull();
    expect(validarFoto({ type: "image/webp", size: 10 })).toBeNull();
  });

  it("recusa outros formatos e arquivos grandes", () => {
    expect(validarFoto({ type: "image/gif", size: 10 })).toBe("fotoTipo");
    expect(validarFoto({ type: "application/pdf", size: 10 })).toBe("fotoTipo");
    expect(validarFoto({ type: "image/png", size: FOTO_MAX_BYTES + 1 })).toBe("fotoTamanho");
  });
});

describe("mediaSrc", () => {
  it("troca o host da API pela rota do próprio painel", () => {
    expect(mediaSrc("http://127.0.0.1:8000/media/produtos/abc.webp")).toBe(
      "/api/media/produtos/abc.webp",
    );
    expect(mediaSrc("https://api.exemplo.com/media/produtos/abc.webp?v=2")).toBe(
      "/api/media/produtos/abc.webp",
    );
    expect(mediaSrc("/media/produtos/abc.webp")).toBe("/api/media/produtos/abc.webp");
  });

  it("devolve null sem foto ou com URL fora de /media/", () => {
    expect(mediaSrc(null)).toBeNull();
    expect(mediaSrc("")).toBeNull();
    expect(mediaSrc("https://outro.com/imagem.png")).toBeNull();
    expect(mediaSrc("nao é url")).toBeNull();
  });
});

describe("produtosApi: foto", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envia multipart com o campo foto e remove por DELETE", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { id: 1 } });
    const del = vi.spyOn(http, "delete").mockResolvedValue({ data: null });
    const arquivo = new File(["x"], "foto.png", { type: "image/png" });

    await produtosApi.enviarFoto(1, arquivo);
    const [url, body] = post.mock.calls[0] ?? [];
    expect(url).toBe("produtos/1/foto");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("foto")).toBe(arquivo);

    await produtosApi.removerFoto(1);
    expect(del).toHaveBeenCalledWith("produtos/1/foto");
  });
});
