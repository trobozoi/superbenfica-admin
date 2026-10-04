import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { estoquesApi, pedidosApi, produtosApi, relatoriosApi, separacoesApi } from "@/services/api";
import { authService } from "@/services/auth";
import { http } from "@/services/http/client";
import { cleanParams } from "@/services/resource";

describe("services", () => {
  afterEach(() => vi.restoreAllMocks());

  it("cleanParams remove filtros vazios", () => {
    expect(cleanParams({ search: "", loja: undefined, page: 2, ativo: false })).toEqual({
      page: 2,
      ativo: false,
    });
    expect(cleanParams()).toEqual({});
  });

  it("CRUD genérico usa os endpoints do recurso", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: { results: [] } });
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { id: 1 } });
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: { id: 1 } });
    const del = vi.spyOn(http, "delete").mockResolvedValue({ data: null });

    await produtosApi.list({ page: 1, search: "" });
    expect(get).toHaveBeenCalledWith("produtos", { params: { page: 1 } });
    await produtosApi.get(5);
    expect(get).toHaveBeenLastCalledWith("produtos/5");
    await produtosApi.create({ nome: "A", sku: "A", preco: "1.00" });
    expect(post).toHaveBeenCalledWith("produtos", { nome: "A", sku: "A", preco: "1.00" });
    await produtosApi.update(5, { preco: "2.00" });
    expect(patch).toHaveBeenCalledWith("produtos/5", { preco: "2.00" });
    await produtosApi.remove(5);
    expect(del).toHaveBeenCalledWith("produtos/5");
  });

  it("ações de pedido, separação e estoque usam as rotas da API", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: {} });
    await pedidosApi.cancelar(1);
    await pedidosApi.iniciarSeparacao(1);
    await pedidosApi.finalizar(1);
    await separacoesApi.concluir(3);
    await estoquesApi.ajustar(2, { delta: -1, motivo: "perda" });
    expect(post.mock.calls.map(([url]) => url)).toEqual([
      "pedidos/1/cancelar",
      "pedidos/1/iniciar-separacao",
      "pedidos/1/finalizar",
      "separacoes/3/concluir",
      "estoques/2/ajustar",
    ]);
  });

  it("relatórios enviam apenas parâmetros preenchidos", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: [] });
    await relatoriosApi.vendas({ loja: undefined, inicio: "2026-10-01" });
    await relatoriosApi.maisVendidos();
    await relatoriosApi.pedidosPorStatus({ loja: 1 });
    await relatoriosApi.estoqueBaixo();
    expect(get).toHaveBeenNthCalledWith(1, "relatorios/vendas", {
      params: { inicio: "2026-10-01" },
    });
    expect(get).toHaveBeenNthCalledWith(3, "relatorios/pedidos-por-status", {
      params: { loja: 1 },
    });
  });

  it("authService faz login, logout e obtém o token do WebSocket", async () => {
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { user: { nome: "A" } } })
      .mockRejectedValueOnce(new Error("rede"));
    await expect(authService.login({ email: "a@a.com", password: "x" })).resolves.toEqual({
      nome: "A",
    });
    await expect(authService.logout()).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledTimes(2);

    vi.spyOn(axios, "get").mockResolvedValueOnce({ data: { token: "abc" } });
    await expect(authService.getRealtimeToken()).resolves.toBe("abc");
  });

  it("getRealtimeToken renova a sessão quando o token expirou", async () => {
    vi.spyOn(axios, "get")
      .mockRejectedValueOnce(new Error("401"))
      .mockResolvedValueOnce({ data: { token: "novo" } });
    vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    await expect(authService.getRealtimeToken()).resolves.toBe("novo");
  });

  it("getRealtimeToken devolve null sem sessão", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(new Error("401"));
    vi.spyOn(axios, "post").mockRejectedValue(new Error("401"));
    await expect(authService.getRealtimeToken()).resolves.toBeNull();
  });
});
