import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FormasPagamentoView } from "@/features/pagamentos/components/formas-pagamento-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pagamentos");
  return { title: t("title") };
}

export default function FormasPagamentoPage() {
  return <FormasPagamentoView />;
}
