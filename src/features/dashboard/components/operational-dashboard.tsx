"use client";

import { ClipboardList, PackageCheck, Timer } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { OPERATIONAL_STATUSES, useOperationalCounts } from "../hooks";
import { KpiCard } from "./kpi-card";

const CARD_CONFIG = {
  PENDENTE: { labelKey: "aguardandoSeparacao", icon: Timer, href: "/separacao" },
  EM_SEPARACAO: { labelKey: "emSeparacao", icon: ClipboardList, href: "/separacao" },
  SEPARADO: { labelKey: "prontosParaCaixa", icon: PackageCheck, href: "/pedidos?status=SEPARADO" },
} as const;

/** Visão de separadores e caixas: o que está na fila agora. */
export function OperationalDashboard() {
  const t = useTranslations("dashboard");
  const counts = useOperationalCounts();

  return (
    <section aria-label={t("operationalTitle")} className="grid gap-4 sm:grid-cols-3">
      {OPERATIONAL_STATUSES.map((status, index) => {
        const { labelKey, icon, href } = CARD_CONFIG[status];
        const query = counts[index];
        return (
          <KpiCard
            key={status}
            label={t(labelKey)}
            icon={icon}
            isLoading={query?.isLoading}
            value={formatNumber(query?.data ?? 0)}
            footer={
              <Button asChild variant="link" className="h-auto justify-start px-0">
                <Link href={href}>{t("goToQueue")}</Link>
              </Button>
            }
          />
        );
      })}
    </section>
  );
}
