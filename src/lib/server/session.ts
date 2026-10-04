import "server-only";
import { cookies } from "next/headers";
import { isExpired, sessionFromAccessToken } from "@/lib/auth/session";
import type { SessionUser } from "@/types/auth";
import { ACCESS_COOKIE } from "./auth-cookies";

/**
 * Sessão atual para Server Components. O proxy (src/proxy.ts) já renova o access token
 * nas navegações, então aqui basta ler o cookie.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const user = sessionFromAccessToken(store.get(ACCESS_COOKIE)?.value);
  if (!user || isExpired(user.exp, Date.now(), 0)) return null;
  return user;
}
