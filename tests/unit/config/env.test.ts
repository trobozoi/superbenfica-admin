import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv, trimTrailingSlash } from "@/config/env";

describe("config/env", () => {
  it("aceita URLs válidas e remove a barra final", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_WS_URL: "wss://api.superbenfica.com.br/",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    expect(env.NEXT_PUBLIC_WS_URL).toBe("wss://api.superbenfica.com.br");
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("production");
  });

  it("usa development quando NEXT_PUBLIC_APP_ENV não é informado", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_WS_URL: "ws://localhost:8000" }).NEXT_PUBLIC_APP_ENV).toBe(
      "development",
    );
  });

  it("explica quais variáveis estão ausentes", () => {
    expect(() => parsePublicEnv({})).toThrow(/NEXT_PUBLIC_WS_URL/);
  });

  it("rejeita protocolo errado para o WebSocket", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_WS_URL: "http://localhost:8000" })).toThrow();
  });

  it("valida a URL da API do servidor", () => {
    expect(parseServerEnv({ API_URL: "https://api.exemplo.com//" }).API_URL).toBe(
      "https://api.exemplo.com",
    );
    expect(() => parseServerEnv({ API_URL: "ftp://exemplo.com" })).toThrow(/API_URL/);
  });

  it("trimTrailingSlash não altera strings sem barra final", () => {
    expect(trimTrailingSlash("abc")).toBe("abc");
    expect(trimTrailingSlash("///")).toBe("");
  });
});
