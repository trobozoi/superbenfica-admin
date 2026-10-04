import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConfiguracoesView } from "@/features/configuracoes/components/configuracoes-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("configuracoes");
  return { title: t("title") };
}

export default function ConfiguracoesPage() {
  return <ConfiguracoesView />;
}
