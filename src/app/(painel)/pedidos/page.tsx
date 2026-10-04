import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PedidosView } from "@/features/pedidos/components/pedidos-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pedidos");
  return { title: t("title") };
}

export default function PedidosPage() {
  // useSearchParams (filtro ?status=) exige um limite de Suspense.
  return (
    <Suspense>
      <PedidosView />
    </Suspense>
  );
}
