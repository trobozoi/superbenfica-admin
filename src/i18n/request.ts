import { getRequestConfig } from "next-intl/server";

/**
 * Idioma único por enquanto (pt-BR), sem prefixo na URL. Para adicionar outro idioma,
 * crie src/messages/<locale>.json e escolha o locale aqui (cookie ou Accept-Language).
 */
export const DEFAULT_LOCALE = "pt-BR";

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  timeZone: "America/Sao_Paulo",
  messages: (await import(`../messages/${DEFAULT_LOCALE}.json`)).default,
}));
