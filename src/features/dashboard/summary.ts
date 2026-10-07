import { toNumber } from "@/lib/format";
import {
  PEDIDO_STATUS,
  type PedidoStatus,
  type PedidosPorStatus,
  type VendasLoja,
} from "@/types/api";

export interface VendasResumo {
  faturamento: number;
  pedidos: number;
  ticketMedio: number;
}

/** Consolida o relatório de vendas (uma linha por filial) em totais da rede. */
export function resumirVendas(vendas: readonly VendasLoja[] | undefined): VendasResumo {
  const faturamento = (vendas ?? []).reduce((sum, row) => sum + toNumber(row.faturamento), 0);
  const pedidos = (vendas ?? []).reduce((sum, row) => sum + row.pedidos, 0);
  return { faturamento, pedidos, ticketMedio: pedidos > 0 ? faturamento / pedidos : 0 };
}

const EM_ABERTO: readonly PedidoStatus[] = [
  "PENDENTE",
  "EM_SEPARACAO",
  "SEPARADO",
  "SAIU_PARA_ENTREGA",
];

export function pedidosEmAberto(porStatus: PedidosPorStatus | undefined): number {
  if (!porStatus) return 0;
  return EM_ABERTO.reduce((sum, status) => sum + (porStatus[status] ?? 0), 0);
}

/** Linhas do gráfico de status, sempre na ordem do fluxo do pedido. */
export function statusChartData(
  porStatus: PedidosPorStatus | undefined,
  label: (status: PedidoStatus) => string,
): { label: string; value: number }[] | undefined {
  if (!porStatus) return undefined;
  return PEDIDO_STATUS.map((status) => ({ label: label(status), value: porStatus[status] ?? 0 }));
}
