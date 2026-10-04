import { type NextRequest, NextResponse } from "next/server";
import { isProduction, publicEnv } from "@/config/env";
import { VIACEP } from "@/config/endpoints";
import { canAccessPath } from "@/config/permissions";
import { isExpired, sessionFromAccessToken } from "@/lib/auth/session";
import {
  ACCESS_COOKIE,
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
  type TokenPair,
} from "@/lib/server/auth-cookies";
import { refreshTokens } from "@/lib/server/django";
import type { SessionUser } from "@/types/auth";

/**
 * Proxy do Next 16 (antigo middleware). Roda antes de cada página e:
 * 1. aplica a Content-Security-Policy com nonce por requisição;
 * 2. renova o access token expirado usando o refresh token;
 * 3. redireciona para /login quem não está autenticado;
 * 4. bloqueia rotas que o perfil do usuário não pode acessar.
 */

const LOGIN_PATH = "/login";
const FORBIDDEN_PATH = "/acesso-negado";

function buildCsp(nonce: string): string {
  const wsOrigin = new URL(publicEnv.NEXT_PUBLIC_WS_URL).origin;
  const devEval = isProduction ? "" : " 'unsafe-eval'";
  // Só em desenvolvimento: extensões do editor (ex.: Console Ninja) abrem WebSocket local
  // em porta aleatória; bloqueadas, enchiam o terminal do `next dev` de erros.
  const devWs = isProduction ? "" : " ws:";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`,
    // Recharts e Radix aplicam estilos inline (atributo style), que nonce não cobre.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${wsOrigin} ${VIACEP.origin}${devWs}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

interface ResolvedSession {
  user: SessionUser | null;
  refreshed: TokenPair | null;
  /** Havia cookies de sessão que precisam ser apagados (refresh inválido). */
  stale: boolean;
}

async function resolveSession(request: NextRequest): Promise<ResolvedSession> {
  const current = sessionFromAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (current && !isExpired(current.exp)) return { user: current, refreshed: null, stale: false };

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return { user: null, refreshed: null, stale: Boolean(current) };

  const tokens = await refreshTokens(refresh);
  const user = sessionFromAccessToken(tokens?.access);
  return user && tokens
    ? { user, refreshed: tokens, stale: false }
    : { user: null, refreshed: null, stale: true };
}

function redirectTo(request: NextRequest, pathname: string, withNext = false): NextResponse {
  const url = new URL(pathname, request.url);
  if (withNext && request.nextUrl.pathname !== "/") {
    url.searchParams.set("next", request.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

function decide(request: NextRequest, user: SessionUser | null): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH;
  if (!user) return isLogin ? null : redirectTo(request, LOGIN_PATH, true);
  if (isLogin) return redirectTo(request, "/");
  if (pathname !== FORBIDDEN_PATH && !canAccessPath(user.role, pathname)) {
    return redirectTo(request, FORBIDDEN_PATH);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const session = await resolveSession(request);

  // Tokens renovados também vão para a requisição atual, para os Server Components.
  if (session.refreshed) {
    request.cookies.set(ACCESS_COOKIE, session.refreshed.access);
    if (session.refreshed.refresh) request.cookies.set(REFRESH_COOKIE, session.refreshed.refresh);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response =
    decide(request, session.user) ?? NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  if (session.refreshed) setAuthCookies(response.cookies, session.refreshed);
  else if (session.stale) clearAuthCookies(response.cookies);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
