import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientesView } from "@/features/clientes/components/clientes-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clientes");
  return { title: t("title") };
}

export default function ClientesPage() {
  return <ClientesView />;
}
