import { describe, expect, it } from "vitest";
import { canAccessPath, hasPermission, isStaffRole, permissionForPath } from "@/config/permissions";

describe("config/permissions", () => {
  it("ADMIN tem acesso total", () => {
    expect(hasPermission("ADMIN", "filiais:write")).toBe(true);
    expect(hasPermission("ADMIN", "relatorios:view")).toBe(true);
  });

  it("GERENTE gerencia a loja, mas não cria filiais", () => {
    expect(hasPermission("GERENTE", "produtos:write")).toBe(true);
    expect(hasPermission("GERENTE", "filiais:write")).toBe(false);
  });

  it("SEPARADOR opera a fila, mas não finaliza pedidos", () => {
    expect(hasPermission("SEPARADOR", "separacao:operate")).toBe(true);
    expect(hasPermission("SEPARADOR", "pedidos:finalize")).toBe(false);
    expect(hasPermission("SEPARADOR", "relatorios:view")).toBe(false);
  });

  it("CAIXA finaliza pedidos e cadastra clientes", () => {
    expect(hasPermission("CAIXA", "pedidos:finalize")).toBe(true);
    expect(hasPermission("CAIXA", "clientes:create")).toBe(true);
    expect(hasPermission("CAIXA", "separacao:view")).toBe(false);
  });

  it("CLIENTE e sessão ausente não acessam nada do painel", () => {
    expect(isStaffRole("CLIENTE")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(hasPermission("CLIENTE", "dashboard:view")).toBe(false);
    expect(hasPermission(null, "dashboard:view")).toBe(false);
  });

  it("resolve a permissão pelo prefixo da rota", () => {
    expect(permissionForPath("/configuracoes")).toBe("configuracoes:view");
    expect(permissionForPath("/formas-pagamento")).toBe("pagamentos:view");
    expect(hasPermission("GERENTE", "pagamentos:view")).toBe(true);
    expect(hasPermission("GERENTE", "pagamentos:write")).toBe(false);
    expect(hasPermission("ADMIN", "pagamentos:write")).toBe(true);
    expect(hasPermission("CAIXA", "pagamentos:view")).toBe(false);
    expect(permissionForPath("/pedidos/123")).toBe("pedidos:view");
    expect(permissionForPath("/pedidosx")).toBe("dashboard:view");
    expect(permissionForPath("/")).toBe("dashboard:view");
  });

  it("bloqueia rotas sem permissão", () => {
    expect(canAccessPath("SEPARADOR", "/configuracoes")).toBe(false);
    expect(canAccessPath("SEPARADOR", "/separacao")).toBe(true);
    expect(canAccessPath("CAIXA", "/relatorios")).toBe(false);
  });
});
