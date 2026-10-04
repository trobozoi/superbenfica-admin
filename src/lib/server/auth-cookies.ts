import "server-only";
import type { NextResponse } from "next/server";
import { isProduction } from "@/config/env";
import { tokenExpiry } from "@/lib/auth/session";

type ResponseCookies = NextResponse["cookies"];

/**
 * Tokens JWT ficam SOMENTE em cookies httpOnly (inacessíveis ao JavaScript da página),
 * o que protege contra roubo de sessão via XSS. SameSite=Lax bloqueia o envio dos
 * cookies em POSTs vindos de outros sites (proteção básica contra CSRF).
 */
export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";

export interface TokenPair {
  access: string;
  refresh?: string;
}

function maxAgeFor(token: string): number {
  const exp = tokenExpiry(token);
  if (exp === null) return 0;
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

function baseOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** A validade de cada cookie acompanha a expiração do próprio token (definida na API). */
export function setAuthCookies(cookies: ResponseCookies, tokens: TokenPair): void {
  cookies.set(ACCESS_COOKIE, tokens.access, baseOptions(maxAgeFor(tokens.access)));
  if (tokens.refresh) {
    cookies.set(REFRESH_COOKIE, tokens.refresh, baseOptions(maxAgeFor(tokens.refresh)));
  }
}

export function clearAuthCookies(cookies: ResponseCookies): void {
  cookies.set(ACCESS_COOKIE, "", baseOptions(0));
  cookies.set(REFRESH_COOKIE, "", baseOptions(0));
}
