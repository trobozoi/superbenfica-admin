import { type NextRequest, NextResponse } from "next/server";
import { sessionFromAccessToken } from "@/lib/auth/session";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/lib/server/auth-cookies";
import { isTrustedRequest } from "@/lib/server/csrf";
import { refreshTokens } from "@/lib/server/django";

/** Renova o access token usando o refresh token guardado no cookie httpOnly. */
export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) {
    return NextResponse.json({ detail: "Origem não permitida." }, { status: 403 });
  }

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const tokens = refresh ? await refreshTokens(refresh) : null;
  const user = sessionFromAccessToken(tokens?.access);

  if (!tokens || !user) {
    const response = NextResponse.json({ detail: "Sessão expirada." }, { status: 401 });
    clearAuthCookies(response.cookies);
    return response;
  }

  const response = NextResponse.json({ user });
  setAuthCookies(response.cookies, tokens);
  return response;
}
