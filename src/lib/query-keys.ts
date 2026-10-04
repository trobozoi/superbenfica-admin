import type { ListParams, RelatorioParams } from "@/types/api";

/**
 * Chaves do TanStack Query centralizadas. O primeiro elemento é o "domínio",
 * usado pelo real-time para invalidar tudo de um recurso de uma vez.
 */
export const queryKeys = {
  list: (resource: string, params?: ListParams) => [resource, "list", params ?? {}] as const,
  detail: (resource: string, id: number) => [resource, "detail", id] as const,
  relatorio: (name: string, params?: RelatorioParams) =>
    ["relatorios", name, params ?? {}] as const,
  me: ["usuarios", "me"] as const,
};

/** Domínios afetados por cada tipo de evento em tempo real. */
export const REALTIME_INVALIDATIONS = {
  pedido: ["pedidos", "separacoes", "relatorios"],
  estoque: ["estoques", "relatorios"],
} as const;
