import { afterEach, describe, expect, it, vi } from "vitest";
import { emailLembrado, lembrarLogin } from "@/features/auth/lembrar-login";

class FakePasswordCredential {
  constructor(readonly data: { id: string; password: string }) {}
}

describe("features/auth/lembrar-login", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "credentials");
  });

  function stubCredentials() {
    const store = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "credentials", { value: { store }, configurable: true });
    vi.stubGlobal("PasswordCredential", FakePasswordCredential);
    return store;
  }

  it("com a opção marcada, entrega a senha ao navegador e guarda só o e-mail", async () => {
    const store = stubCredentials();
    await lembrarLogin("ana@superbenfica.com.br", "segredo-123", true);

    expect(store).toHaveBeenCalledOnce();
    expect(store.mock.calls[0]?.[0]).toMatchObject({
      data: { id: "ana@superbenfica.com.br", password: "segredo-123" },
    });
    expect(emailLembrado()).toBe("ana@superbenfica.com.br");
    expect(JSON.stringify({ ...localStorage })).not.toContain("segredo-123");
  });

  it("desmarcada, não pede para salvar e esquece o e-mail", async () => {
    const store = stubCredentials();
    localStorage.setItem("sb_login_email", "ana@superbenfica.com.br");
    await lembrarLogin("ana@superbenfica.com.br", "segredo-123", false);

    expect(store).not.toHaveBeenCalled();
    expect(emailLembrado()).toBeNull();
  });

  it("sem suporte no navegador ou com recusa, o login segue normalmente", async () => {
    await expect(lembrarLogin("a@b.com", "x", true)).resolves.toBeUndefined();
    expect(emailLembrado()).toBe("a@b.com");

    stubCredentials().mockRejectedValue(new Error("NotAllowedError"));
    await expect(lembrarLogin("a@b.com", "x", true)).resolves.toBeUndefined();
  });
});
