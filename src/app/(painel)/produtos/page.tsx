import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProdutosView } from "@/features/produtos/components/produtos-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("produtos");
  return { title: t("title") };
}

export default function ProdutosPage() {
  return <ProdutosView />;
}
