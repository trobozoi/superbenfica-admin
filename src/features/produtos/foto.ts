/**
 * Validação da foto no navegador, só para dar retorno imediato ao usuário.
 * A API valida de novo pelo conteúdo real do arquivo e regrava a imagem em WebP.
 */
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;
export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;

export type FotoErro = "fotoTipo" | "fotoTamanho";

export function validarFoto(file: Pick<File, "type" | "size">): FotoErro | null {
  if (!(FOTO_TIPOS as readonly string[]).includes(file.type)) return "fotoTipo";
  if (file.size > FOTO_MAX_BYTES) return "fotoTamanho";
  return null;
}
