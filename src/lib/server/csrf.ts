import "server-only";
import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Defesa contra CSRF nas rotas do BFF autenticadas por cookie:
 * 1. a origem (Origin) precisa ser a do próprio painel;
 * 2. requisições que alteram dados precisam do cabeçalho X-Requested-With, que um
 *    formulário de outro site não consegue enviar sem passar pelo CORS.
 */
export function isTrustedRequest(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return false;
  return request.headers.get("x-requested-with") === "XMLHttpRequest";
}
