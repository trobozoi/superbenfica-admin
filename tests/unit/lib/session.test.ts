import { describe, expect, it } from "vitest";
import { isExpired, sessionFromAccessToken, tokenExpiry } from "@/lib/auth/session";
import { makeToken } from "../../helpers";

describe("lib/auth/session", () => {
  it("extrai o usuário das claims da API", () => {
    const token = makeToken({ role: "CAIXA", nome: "Caixa Centro", loja_id: 2, user_id: 9 });
    expect(sessionFromAccessToken(token)).toMatchObject({
      id: 9,
      nome: "Caixa Centro",
      role: "CAIXA",
      lojaId: 2,
    });
  });

  it("aceita superusuário sem filial", () => {
    const token = makeToken({ role: "ADMIN", loja_id: null });
    expect(sessionFromAccessToken(token)?.lojaId).toBeNull();
  });

  it("rejeita role desconhecida, token ausente ou malformado", () => {
    expect(sessionFromAccessToken(makeToken({ role: "HACKER" }))).toBeNull();
    expect(sessionFromAccessToken(undefined)).toBeNull();
    expect(sessionFromAccessToken("nao.e.jwt")).toBeNull();
  });

  it("lê a expiração do token", () => {
    const token = makeToken({ expiresIn: 60 });
    const exp = tokenExpiry(token);
    expect(exp).toBeGreaterThan(Date.now() / 1000);
    expect(tokenExpiry("invalido")).toBeNull();
    expect(tokenExpiry(null)).toBeNull();
  });

  it("considera a margem de segurança ao checar expiração", () => {
    const now = 1_000_000_000;
    expect(isExpired(now / 1000 + 5, now, 10)).toBe(true);
    expect(isExpired(now / 1000 + 60, now, 10)).toBe(false);
    expect(isExpired(null)).toBe(true);
  });
});
