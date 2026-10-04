import { BFF_ROUTES } from "@/config/endpoints";

const MEDIA_PREFIX = "/media/";

/**
 * Converte a URL absoluta de uma foto da API (ex.: http://api/media/produtos/x.webp)
 * para a rota do próprio painel (/api/media/produtos/x.webp). Assim a imagem vem da
 * mesma origem: a CSP não precisa liberar o host da API e trocar a URL da API para
 * produção continua sendo só mudar o .env.
 */
export function mediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  let pathname: string;
  try {
    // A API envia URL absoluta; um caminho relativo (/media/...) também é aceito.
    pathname = url.startsWith("/") ? (url.split(/[?#]/)[0] ?? "") : new URL(url).pathname;
  } catch {
    return null;
  }
  const index = pathname.indexOf(MEDIA_PREFIX);
  if (index === -1) return null;
  return `${BFF_ROUTES.media}/${pathname.slice(index + MEDIA_PREFIX.length)}`;
}
