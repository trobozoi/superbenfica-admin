import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/server/auth-cookies";
import { isTrustedRequest } from "@/lib/server/csrf";
import { djangoFetch } from "@/lib/server/django";

/**
 * Proxy autenticado do navegador para a API Django (padrão BFF).
 * O navegador chama /api/proxy/<recurso>; aqui o token do cookie httpOnly vira o
 * cabeçalho Authorization. Se o access expirou, a API responde 401 e o cliente HTTP
 * renova a sessão (src/services/http/client.ts) e repete a requisição.
 */

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

// Só segmentos simples: impede path traversal ("..") e URLs arbitrárias.
const SEGMENT = /^[\w-]+$/;
// Mesmo limite do Nginx da API (client_max_body_size 5m); fotos têm no máximo 2 MB.
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition", "retry-after"];

async function forward(request: NextRequest, { params }: RouteContext) {
  if (!isTrustedRequest(request)) {
    return NextResponse.json({ detail: "Origem não permitida." }, { status: 403 });
  }

  const { path } = await params;
  if (path.length === 0 || !path.every((segment) => SEGMENT.test(segment))) {
    return NextResponse.json({ detail: "Recurso inválido." }, { status: 400 });
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ detail: "Não autenticado." }, { status: 401 });
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ detail: "Arquivo grande demais." }, { status: 413 });
  }
  let upstream: Response;
  try {
    upstream = await djangoFetch(path.join("/"), {
      method: request.method,
      accessToken,
      search: request.nextUrl.search,
      // Bytes, não texto: preserva uploads binários (multipart com imagens).
      body: hasBody ? await request.arrayBuffer() : null,
      contentType: hasBody ? request.headers.get("content-type") : null,
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível." }, { status: 503 });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
