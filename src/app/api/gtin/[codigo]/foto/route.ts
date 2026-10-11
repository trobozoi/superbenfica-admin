import { type NextRequest, NextResponse } from "next/server";
import { COSMOS_CDN } from "@/config/endpoints";
import { FOTO_MAX_BYTES, tipoPelaAssinatura } from "@/features/produtos/foto";
import { gtinValido } from "@/lib/gtin";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/auth-cookies";

/**
 * Baixa a foto de um produto no CDN do Cosmos pelo código de barras, pela mesma origem
 * do painel (o CDN não libera CORS). Não é um proxy aberto: só usuários com sessão,
 * só GTIN válido e só imagens nos formatos e no tamanho que o cadastro aceita.
 */

interface RouteContext {
  params: Promise<{ codigo: string }>;
}

const TIMEOUT_MS = 10_000;

export async function GET(request: NextRequest, { params }: RouteContext) {
  const hasSession = request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (!hasSession) return new NextResponse(null, { status: 401 });

  const { codigo } = await params;
  if (!gtinValido(codigo)) return new NextResponse(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(COSMOS_CDN.fotoUrl(codigo), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  // Código sem foto no Cosmos: o CDN responde 404 com uma página HTML.
  const tamanho = Number(upstream.headers.get("content-length") ?? 0);
  if (!upstream.ok || tamanho > FOTO_MAX_BYTES) {
    await upstream.body?.cancel();
    return new NextResponse(null, { status: 404 });
  }

  // O CDN não envia Content-Type: o formato vem da assinatura do próprio arquivo.
  const foto = new Uint8Array(await upstream.arrayBuffer());
  const contentType = tipoPelaAssinatura(foto);
  if (!contentType || foto.byteLength > FOTO_MAX_BYTES) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(foto, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
