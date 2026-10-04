import { TicketPercent } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("promocoes");
  return { title: t("title") };
}

/**
 * A API ainda não tem endpoints de promoções/cupons (veja superbenfica-api/docs/api.md).
 * Quando existirem: adicione-os em src/config/endpoints.ts, crie o serviço com
 * createResource() em src/services/api.ts e siga o padrão de src/features/produtos.
 */
export default async function PromocoesPage() {
  const t = await getTranslations("promocoes");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <TicketPercent className="size-10 text-muted-foreground" aria-hidden />
          <h2 className="font-semibold">{t("pendingTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("pendingDescription")}</p>
        </CardContent>
      </Card>
    </>
  );
}
