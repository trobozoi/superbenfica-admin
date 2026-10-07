"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toIsoDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { pedidosApi, relatoriosApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { resolveLojaId, useFilialStore } from "@/store/filial-store";
import type { PedidoStatus, RelatorioParams } from "@/types/api";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Filial efetiva para filtros (ADMIN: a selecionada; demais: a própria). */
export function useLojaFilter(): number | undefined {
  const user = useAuthStore((state) => state.user);
  const selected = useFilialStore((state) => state.selectedLojaId);
  return resolveLojaId(user, selected) ?? undefined;
}

/** Indicadores gerenciais (perfis com acesso a relatórios). */
function dashboardDates() {
  const now = Date.now();
  return { today: toIsoDate(new Date(now)), monthAgo: toIsoDate(new Date(now - THIRTY_DAYS_MS)) };
}

export function useManagementDashboard() {
  const loja = useLojaFilter();
  // Datas fixadas na montagem: recalcular a cada render mudaria as query keys.
  const [{ today, monthAgo }] = useState(dashboardDates);
  const hoje: RelatorioParams = { loja, inicio: today, fim: today };
  const ultimos30: RelatorioParams = { loja, inicio: monthAgo, fim: today };

  return {
    vendasHoje: useQuery({
      queryKey: queryKeys.relatorio("vendas", hoje),
      queryFn: () => relatoriosApi.vendas(hoje),
    }),
    vendas30: useQuery({
      queryKey: queryKeys.relatorio("vendas", ultimos30),
      queryFn: () => relatoriosApi.vendas(ultimos30),
    }),
    status: useQuery({
      queryKey: queryKeys.relatorio("pedidos-por-status", { loja }),
      queryFn: () => relatoriosApi.pedidosPorStatus({ loja }),
    }),
    maisVendidos: useQuery({
      queryKey: queryKeys.relatorio("mais-vendidos", { ...ultimos30, limite: 5 }),
      queryFn: () => relatoriosApi.maisVendidos({ ...ultimos30, limite: 5 }),
    }),
    estoqueBaixo: useQuery({
      queryKey: queryKeys.relatorio("estoque-baixo", { loja }),
      queryFn: () => relatoriosApi.estoqueBaixo({ loja }),
    }),
  };
}

export const OPERATIONAL_STATUSES = [
  "PENDENTE",
  "EM_SEPARACAO",
  "SEPARADO",
  "SAIU_PARA_ENTREGA",
] as const satisfies readonly PedidoStatus[];

/**
 * Separador e caixa não acessam /relatorios; contamos os pedidos por status usando o
 * total ("count") da listagem paginada, que a API já restringe à filial do usuário.
 */
export function useOperationalCounts() {
  return useQueries({
    queries: OPERATIONAL_STATUSES.map((status) => ({
      queryKey: queryKeys.list(pedidosApi.name, { status, page: 1 }),
      queryFn: () => pedidosApi.list({ status, page: 1 }),
      select: (data: { count: number }) => data.count,
    })),
  });
}
