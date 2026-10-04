import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handleUnauthorized,
  http,
  refreshSession,
  setSessionExpiredHandler,
} from "@/services/http/client";

function unauthorized(config: Partial<InternalAxiosRequestConfig> = {}) {
  const fullConfig = { headers: new AxiosHeaders(), url: "produtos", ...config };
  return new AxiosError("401", "ERR", fullConfig, null, {
    status: 401,
    statusText: "",
    headers: {},
    config: fullConfig,
    data: {},
  });
}

describe("services/http/client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setSessionExpiredHandler(() => undefined);
  });

  it("aponta para o BFF e envia o cabeçalho anti-CSRF", () => {
    expect(http.defaults.baseURL).toBe("/api/proxy");
    expect(http.defaults.headers["X-Requested-With"]).toBe("XMLHttpRequest");
  });

  it("renova a sessão uma vez e repete a requisição após 401", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    const request = vi.spyOn(http, "request").mockResolvedValue({ data: "repetida" });

    await expect(handleUnauthorized(unauthorized())).resolves.toEqual({ data: "repetida" });
    expect(post).toHaveBeenCalledWith("/api/auth/refresh", null, expect.anything());
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ _retried: true }));
  });

  it("requisições simultâneas compartilham um único refresh", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    vi.spyOn(http, "request").mockResolvedValue({ data: "ok" });
    await Promise.all([handleUnauthorized(unauthorized()), handleUnauthorized(unauthorized())]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("encerra a sessão quando o refresh falha", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("expirado"));
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    await expect(handleUnauthorized(unauthorized())).rejects.toBeInstanceOf(AxiosError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("não tenta de novo requisições já repetidas nem outros erros", async () => {
    const post = vi.spyOn(axios, "post");
    await expect(
      handleUnauthorized(unauthorized({ _retried: true } as Partial<InternalAxiosRequestConfig>)),
    ).rejects.toBeInstanceOf(AxiosError);
    await expect(handleUnauthorized(new AxiosError("500"))).rejects.toBeInstanceOf(AxiosError);
    expect(post).not.toHaveBeenCalled();
  });

  it("refreshSession devolve false em falha", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("x"));
    await expect(refreshSession()).resolves.toBe(false);
  });
});
