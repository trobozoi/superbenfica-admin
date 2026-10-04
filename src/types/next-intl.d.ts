import type messages from "@/messages/pt-BR.json";

/** Tipa as chaves de tradução: t("chave.inexistente") vira erro de compilação. */
declare module "next-intl" {
  interface AppConfig {
    Locale: "pt-BR";
    Messages: typeof messages;
  }
}
