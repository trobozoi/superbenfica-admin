import axios from "axios";
import { BFF_ROUTES } from "@/config/endpoints";
import type { LoginInput, SessionUser } from "@/types/auth";
import { refreshSession } from "./http/client";

const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" } as const;

/** Autenticação via BFF: os tokens ficam em cookies httpOnly definidos pelo servidor. */
export const authService = {
  async login(input: LoginInput): Promise<SessionUser> {
    const { data } = await axios.post<{ user: SessionUser }>(BFF_ROUTES.login, input, {
      headers: CSRF_HEADER,
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await axios.post(BFF_ROUTES.logout, null, { headers: CSRF_HEADER }).catch(() => undefined);
  },

  /** Access token para o WebSocket. Renova a sessão uma vez se estiver expirada. */
  async getRealtimeToken(): Promise<string | null> {
    const fetchToken = async () =>
      (await axios.get<{ token: string }>(BFF_ROUTES.wsToken)).data.token;
    try {
      return await fetchToken();
    } catch {
      if (!(await refreshSession())) return null;
      return fetchToken().catch(() => null);
    }
  },
};
