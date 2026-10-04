import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RelatoriosView } from "@/features/relatorios/components/relatorios-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("relatorios");
  return { title: t("title") };
}

export default function RelatoriosPage() {
  return <RelatoriosView />;
}
