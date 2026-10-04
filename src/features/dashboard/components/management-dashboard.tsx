"use client";

import { AlertTriangle, CircleDollarSign, Receipt, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { useManagementDashboard } from "../hooks";
import { pedidosEmAberto, resumirVendas, statusChartData } from "../summary";
import { BarChartCard } from "./bar-chart-card";
import { KpiCard } from "./kpi-card";

export function ManagementDashboard() {
  const t = useTranslations();
  const { vendasHoje, vendas30, status, maisVendidos, estoqueBaixo } = useManagementDashboard();
  const hoje = resumirVendas(vendasHoje.data);

  return (
    <div className="space-y-6">
      <section
        aria-label={t("dashboard.today")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("dashboard.faturamento")}
          hint={t("dashboard.today")}
          icon={CircleDollarSign}
          isLoading={vendasHoje.isLoading}
          value={formatCurrency(hoje.faturamento)}
        />
        <KpiCard
          label={t("dashboard.pedidosFinalizados")}
          hint={t("dashboard.today")}
          icon={Receipt}
          isLoading={vendasHoje.isLoading}
          value={formatNumber(hoje.pedidos)}
        />
        <KpiCard
          label={t("dashboard.pedidosEmAberto")}
          icon={ShoppingCart}
          isLoading={status.isLoading}
          value={formatNumber(pedidosEmAberto(status.data))}
        />
        <KpiCard
          label={t("dashboard.estoqueBaixo")}
          icon={AlertTriangle}
          isLoading={estoqueBaixo.isLoading}
          value={formatNumber(estoqueBaixo.data?.length ?? 0)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title={t("dashboard.pedidosPorStatus")}
          data={statusChartData(status.data, (s) => t(`pedidoStatus.${s}`))}
          isLoading={status.isLoading}
          error={status.error}
          formatValue={formatNumber}
        />
        <BarChartCard
          title={t("dashboard.vendasPorFilial")}
          description={t("dashboard.last30Days")}
          horizontal
          data={vendas30.data?.map((row) => ({
            label: row.loja,
            value: toNumber(row.faturamento),
          }))}
          isLoading={vendas30.isLoading}
          error={vendas30.error}
          formatValue={formatCurrency}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.maisVendidos")}</CardTitle>
          </CardHeader>
          <CardContent>
            {maisVendidos.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ol className="divide-y text-sm">
                {maisVendidos.data?.map((item, index) => (
                  <li
                    key={item.produto_id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="w-5 text-muted-foreground tabular-nums">{index + 1}</span>
                      <span className="truncate">{item.produto}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {t("dashboard.unidades", { count: formatNumber(item.quantidade) })} ·{" "}
                      {formatCurrency(item.faturamento)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.estoqueCritico")}</CardTitle>
          </CardHeader>
          <CardContent>
            {estoqueBaixo.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ul className="divide-y text-sm">
                {estoqueBaixo.data?.slice(0, 6).map((item) => (
                  <li
                    key={`${item.loja_id}-${item.produto_id}`}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.produto_nome}</span>
                      <span className="block text-xs text-muted-foreground">{item.loja_nome}</span>
                    </span>
                    <Badge variant="warning">
                      <AlertTriangle aria-hidden className="size-3" />
                      {item.quantidade} / {item.quantidade_minima}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
