import type { PedidoStatus } from "./api";

/** Eventos publicados pela API (apps/core/realtime.py) nos canais WebSocket. */
export const REALTIME_EVENTS = [
  "pedido.criado",
  "pedido.atualizado",
  "estoque.atualizado",
  "estoque.abaixo_do_minimo",
  "pong",
] as const;
export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

export interface PedidoEventData {
  pedido_id: number;
  codigo: string;
  status: PedidoStatus;
}

export interface EstoqueEventData {
  estoque_id: number;
  produto_id: number;
  quantidade: number;
  abaixo_do_minimo: boolean;
}

export type RealtimeMessage =
  | { evento: "pedido.criado" | "pedido.atualizado"; dados: PedidoEventData }
  | { evento: "estoque.atualizado" | "estoque.abaixo_do_minimo"; dados: EstoqueEventData }
  | { evento: "pong"; dados: Record<string, never> };

export type ConnectionStatus =
  "idle" | "connecting" | "open" | "reconnecting" | "forbidden" | "closed";
