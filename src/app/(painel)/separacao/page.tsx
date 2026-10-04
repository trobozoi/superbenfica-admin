import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SeparacaoBoard } from "@/features/separacao/components/separacao-board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("separacao");
  return { title: t("title") };
}

export default function SeparacaoPage() {
  return <SeparacaoBoard />;
}
