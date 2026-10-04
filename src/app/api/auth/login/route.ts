import { type NextRequest, NextResponse } from "next/server";
import { isStaffRole } from "@/config/permissions";
import { loginSchema } from "@/features/auth/schemas";
import { sessionFromAccessToken } from "@/lib/auth/session";
import { setAuthCookies, type TokenPair } from "@/lib/server/auth-cookies";
import { isTrustedRequest } from "@/lib/server/csrf";
import { obtainTokens, revokeRefreshToken } from "@/lib/server/django";

/** Login: troca e-mail/senha por tokens na API e os grava em cookies httpOnly. */
export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) {
    return NextResponse.json({ detail: "Origem não permitida." }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ detail: "Informe e-mail e senha válidos." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await obtainTokens(parsed.data.email, parsed.data.password);
  } catch {
    return NextResponse.json({ detail: "API indisponível." }, { status: 503 });
  }

  if (!upstream.ok) {
    const status = upstream.status >= 500 ? 502 : upstream.status;
    const body: unknown = await upstream.json().catch(() => ({ detail: "Falha no login." }));
    return NextResponse.json(body, { status });
  }

  const tokens = (await upstream.json()) as TokenPair;
  const user = sessionFromAccessToken(tokens.access);

  // Clientes têm conta na API, mas não acessam o painel administrativo.
  if (!user || !isStaffRole(user.role)) {
    if (tokens.refresh) await revokeRefreshToken(tokens.refresh, tokens.access);
    return NextResponse.json(
      { detail: "Seu perfil não tem acesso ao painel administrativo.", code: "role_not_allowed" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ user });
  setAuthCookies(response.cookies, tokens);
  return response;
}
