import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/auth-cookies";
import { serverEnv } from "@/lib/server/env";

/**
 * Serve as fotos enviadas à API pela mesma origem do painel (/api/media/...).
 * Não é um proxy aberto: só usuários com sessão, só caminhos simples e só imagens.
 */

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

// Pastas e nome de arquivo simples, com extensão de imagem no último segmento.
const FOLDER = /^[\w-]+$/;
const IMAGE_FILE = /^[\w-]+\.(?:webp|png|jpe?g)$/i;
const TIMEOUT_MS = 15_000;

function isSafePath(path: string[]): boolean {
  const file = path.at(-1);
  return (
    path.length >= 1 &&
    file !== undefined &&
    IMAGE_FILE.test(file) &&
    path.slice(0, -1).every((segment) => FOLDER.test(segment))
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const hasSession = request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (!hasSession) return new NextResponse(null, { status: 401 });

  const { path } = await params;
  if (!isSafePath(path)) return new NextResponse(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(`${serverEnv.API_URL}/media/${path.join("/")}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.startsWith("image/")) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      // O nome do arquivo é um UUID novo a cada envio: pode ficar em cache.
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
