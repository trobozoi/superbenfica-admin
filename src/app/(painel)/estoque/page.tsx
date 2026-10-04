import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EstoqueView } from "@/features/estoque/components/estoque-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("estoque");
  return { title: t("title") };
}

export default function EstoquePage() {
  return <EstoqueView />;
}
