"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { type Column, DataTable } from "@/components/shared/data-table";
import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLojaFilter } from "@/features/dashboard/hooks";
import { BarChartCard } from "@/features/dashboard/components/bar-chart-card";
import { formatCurrency, formatNumber, toIsoDate, toNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { relatoriosApi } from "@/services/api";
import type { EstoqueBaixo, RelatorioParams, VendasLoja } from "@/types/api";

const NUMERIC = "tabular-nums";

function defaultPeriod() {
  const fim = new Date();
  const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
  return { inicio: toIsoDate(inicio), fim: toIsoDate(fim) };
}

export function RelatoriosView() {
  const t = useTranslations();
  const loja = useLojaFilter();
  const [draft, setDraft] = useState(defaultPeriod);
  const [period, setPeriod] = useState(draft);
  const params: RelatorioParams = { ...period, loja };

  const vendas = useQuery({
    queryKey: queryKeys.relatorio("vendas", params),
    queryFn: () => relatoriosApi.vendas(params),
  });
  const maisVendidos = useQuery({
    queryKey: queryKeys.relatorio("mais-vendidos", { ...params, limite: 10 }),
    queryFn: () => relatoriosApi.maisVendidos({ ...params, limite: 10 }),
  });
  const estoqueBaixo = useQuery({
    queryKey: queryKeys.relatorio("estoque-baixo", { loja }),
    queryFn: () => relatoriosApi.estoqueBaixo({ loja }),
  });

  const applyPeriod = (event: FormEvent) => {
    event.preventDefault();
    setPeriod(draft);
  };

  const vendasColumns: Column<VendasLoja>[] = [
    { key: "loja", header: t("common.filial"), cell: (v) => v.loja },
    {
      key: "pedidos",
      header: t("relatorios.pedidos"),
      className: NUMERIC,
      cell: (v) => formatNumber(v.pedidos),
    },
    {
      key: "faturamento",
      header: t("relatorios.faturamento"),
      className: NUMERIC,
      cell: (v) => formatCurrency(v.faturamento),
    },
    {
      key: "ticket",
      header: t("relatorios.ticketMedio"),
      className: NUMERIC,
      cell: (v) => formatCurrency(v.ticket_medio),
    },
  ];

  const estoqueColumns: Column<EstoqueBaixo>[] = [
    { key: "produto", header: t("estoque.produto"), cell: (e) => e.produto_nome },
    { key: "loja", header: t("common.filial"), cell: (e) => e.loja_nome, hideOnMobile: true },
    {
      key: "quantidade",
      header: t("estoque.quantidade"),
      className: NUMERIC,
      cell: (e) => formatNumber(e.quantidade),
    },
    {
      key: "minimo",
      header: t("estoque.minimo"),
      className: NUMERIC,
      cell: (e) => formatNumber(e.quantidade_minima),
    },
  ];

  return (
    <>
      <PageHeader title={t("relatorios.title")} description={t("relatorios.description")} />
      <Card className="mb-6">
        <CardContent className="pt-5">
          <form
            onSubmit={applyPeriod}
            className="flex flex-wrap items-end gap-3"
            aria-label={t("relatorios.periodo")}
          >
            <FormField label={t("common.from")}>
              <Input
                type="date"
                value={draft.inicio}
                max={draft.fim}
                onChange={(e) => setDraft({ ...draft, inicio: e.target.value })}
              />
            </FormField>
            <FormField label={t("common.to")}>
              <Input
                type="date"
                value={draft.fim}
                min={draft.inicio}
                onChange={(e) => setDraft({ ...draft, fim: e.target.value })}
              />
            </FormField>
            <Button type="submit">{t("common.apply")}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("relatorios.vendas")}</h2>
          <DataTable
            columns={vendasColumns}
            rows={vendas.data}
            getRowId={(v) => v.loja_id}
            isLoading={vendas.isLoading}
            error={vendas.error}
            onRetry={() => void vendas.refetch()}
          />
        </section>

        <BarChartCard
          title={t("relatorios.maisVendidos")}
          description={t("relatorios.quantidade")}
          horizontal
          data={maisVendidos.data?.map((p) => ({ label: p.produto, value: p.quantidade }))}
          isLoading={maisVendidos.isLoading}
          error={maisVendidos.error}
          formatValue={formatNumber}
        />

        <BarChartCard
          title={t("relatorios.faturamento")}
          horizontal
          data={vendas.data?.map((v) => ({ label: v.loja, value: toNumber(v.faturamento) }))}
          isLoading={vendas.isLoading}
          error={vendas.error}
          formatValue={formatCurrency}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("relatorios.estoqueBaixo")}</h2>
          <DataTable
            columns={estoqueColumns}
            rows={estoqueBaixo.data}
            getRowId={(e) => `${e.loja_id}-${e.produto_id}`}
            isLoading={estoqueBaixo.isLoading}
            error={estoqueBaixo.error}
            onRetry={() => void estoqueBaixo.refetch()}
          />
        </section>
      </div>
    </>
  );
}
