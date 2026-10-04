import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/config/navigation";
import { queryKeys, REALTIME_INVALIDATIONS } from "@/lib/query-keys";

describe("lib/query-keys", () => {
  it("o domínio é sempre o primeiro elemento da chave", () => {
    expect(queryKeys.list("produtos", { page: 2 })).toEqual(["produtos", "list", { page: 2 }]);
    expect(queryKeys.list("produtos")).toEqual(["produtos", "list", {}]);
    expect(queryKeys.detail("pedidos", 3)).toEqual(["pedidos", "detail", 3]);
    expect(queryKeys.relatorio("vendas")[0]).toBe("relatorios");
    expect(queryKeys.me[0]).toBe("usuarios");
  });

  it("eventos de pedido atualizam também a fila e os relatórios", () => {
    expect(REALTIME_INVALIDATIONS.pedido).toEqual(["pedidos", "separacoes", "relatorios"]);
    expect(REALTIME_INVALIDATIONS.estoque).toContain("estoques");
  });

  it("todo item de menu tem rota e permissão", () => {
    expect(NAV_ITEMS.every((item) => item.href.startsWith("/") && item.permission)).toBe(true);
  });
});
