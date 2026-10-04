import "server-only";
import { AUTH_ENDPOINTS } from "@/config/endpoints";
import { serverEnv } from "./env";
import type { TokenPair } from "./auth-cookies";

const REQUEST_TIMEOUT_MS = 15_000;

/** Monta a URL da API garantindo a barra final exigida pelo Django. */
export function apiUrl(path: string, search = ""): string {
  const clean = path.split("/").filter(Boolean).join("/");
  return `${serverEnv.API_URL}/api/${clean}/${search}`;
}

export interface DjangoRequestInit {
  method?: string;
  body?: BodyInit | null;
  accessToken?: string;
  contentType?: string | null;
  search?: string;
}

/** fetch para a API Django com timeout e cabeçalhos padrão. */
export function djangoFetch(path: string, init: DjangoRequestInit = {}): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (init.contentType) headers.set("Content-Type", init.contentType);
  if (init.accessToken) headers.set("Authorization", `Bearer ${init.accessToken}`);
  return fetch(apiUrl(path, init.search), {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

function postJson(path: string, payload: unknown): Promise<Response> {
  return djangoFetch(path, {
    method: "POST",
    body: JSON.stringify(payload),
    contentType: "application/json",
  });
}

export async function obtainTokens(email: string, password: string): Promise<Response> {
  return postJson(AUTH_ENDPOINTS.token, { email, password });
}

/** Renova o par de tokens. A API rotaciona o refresh e invalida o anterior. */
export async function refreshTokens(refresh: string): Promise<TokenPair | null> {
  try {
    const response = await postJson(AUTH_ENDPOINTS.refresh, { refresh });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<TokenPair>;
    return typeof data.access === "string" ? { access: data.access, refresh: data.refresh } : null;
  } catch {
    return null;
  }
}

/** Coloca o refresh token na blacklist. Falhas são ignoradas: o logout local acontece mesmo assim. */
export async function revokeRefreshToken(refresh: string, accessToken?: string): Promise<void> {
  try {
    await djangoFetch(AUTH_ENDPOINTS.logout, {
      method: "POST",
      body: JSON.stringify({ refresh }),
      contentType: "application/json",
      accessToken,
    });
  } catch {
    // Melhor esforço: o token expira sozinho de qualquer forma.
  }
}
