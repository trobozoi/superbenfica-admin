/**
 * Validação da foto no navegador, só para dar retorno imediato ao usuário.
 * A API valida de novo pelo conteúdo real do arquivo e regrava a imagem em WebP.
 */
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;
export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;

export type FotoErro = "fotoTipo" | "fotoTamanho";
export type FotoTipo = (typeof FOTO_TIPOS)[number];

function comecaCom(bytes: Uint8Array, assinatura: readonly number[], inicio = 0): boolean {
  return assinatura.every((byte, indice) => bytes[inicio + indice] === byte);
}

const ASCII = (texto: string) => [...texto].map((letra) => letra.codePointAt(0) ?? 0);

/**
 * Tipo da imagem pelos primeiros bytes (assinatura), para fontes que não enviam um
 * Content-Type confiável, como o CDN do Cosmos. null = não é JPEG, PNG nem WebP.
 */
export function tipoPelaAssinatura(bytes: Uint8Array): FotoTipo | null {
  if (comecaCom(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (comecaCom(bytes, ASCII("RIFF")) && comecaCom(bytes, ASCII("WEBP"), 8)) return "image/webp";
  return null;
}

export function validarFoto(file: Pick<File, "type" | "size">): FotoErro | null {
  if (!(FOTO_TIPOS as readonly string[]).includes(file.type)) return "fotoTipo";
  if (file.size > FOTO_MAX_BYTES) return "fotoTamanho";
  return null;
}
