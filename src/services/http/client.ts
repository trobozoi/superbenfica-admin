import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { BFF_ROUTES } from "@/config/endpoints";
import { singleFlight } from "@/lib/single-flight";

/**
 * Cliente HTTP do navegador. Todas as chamadas passam pelo BFF (/api/proxy), que injeta
 * o token guardado em cookie httpOnly. O navegador nunca manipula tokens.
 */

const REQUEST_TIMEOUT_MS = 20_000;
const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" } as const;

export const http = axios.create({
  baseURL: BFF_ROUTES.proxy,
  timeout: REQUEST_TIMEOUT_MS,
  headers: CSRF_HEADER,
  withCredentials: true,
});

/** Renova a sessão uma única vez, mesmo que várias requisições recebam 401 juntas. */
export const refreshSession = singleFlight(async (): Promise<boolean> => {
  try {
    await axios.post(BFF_ROUTES.refresh, null, { headers: CSRF_HEADER });
    return true;
  } catch {
    return false;
  }
});

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler = () => undefined;

/** O AuthProvider registra aqui o que fazer quando a sessão não puder ser renovada. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export async function handleUnauthorized(error: AxiosError): Promise<unknown> {
  const config = error.config as RetriableConfig | undefined;
  if (error.response?.status !== 401 || !config || config._retried) {
    throw error;
  }
  config._retried = true;
  const renewed = await refreshSession();
  if (!renewed) {
    onSessionExpired();
    throw error;
  }
  return http.request(config);
}

http.interceptors.response.use((response) => response, handleUnauthorized);
