"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLojas } from "@/components/layout/filial-selector";
import { publicEnv } from "@/config/env";
import { WS_CHANNELS } from "@/config/endpoints";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { RealtimeClient } from "@/lib/realtime/realtime-client";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { resolveLojaId, useFilialStore } from "@/store/filial-store";
import { combineStatuses, useRealtimeStore } from "@/store/realtime-store";
import type { ConnectionStatus, RealtimeMessage } from "@/types/realtime";

/**
 * Mantém a conexão WebSocket com o canal da filial e traduz eventos em
 * invalidações do TanStack Query: as telas abertas se atualizam sozinhas.
 * O ADMIN em "todas as filiais" escuta o canal de cada filial ativa.
 */
export function RealtimeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const user = useAuthStore((state) => state.user);
  const selectedLojaId = useFilialStore((state) => state.selectedLojaId);
  const lojaId = resolveLojaId(user, selectedLojaId);
  const todasAsFiliais = user?.role === "ADMIN" && lojaId === null;
  const { data: lojas } = useLojas({ enabled: todasAsFiliais });
  // Chave estável (string) para não reconectar a cada nova referência da lista.
  const lojaIdsKey = useMemo(() => {
    if (lojaId !== null) return String(lojaId);
    if (!todasAsFiliais) return "";
    return (lojas ?? [])
      .filter((loja) => loja.ativa !== false)
      .map((loja) => loja.id)
      .join(",");
  }, [lojaId, todasAsFiliais, lojas]);

  useEffect(() => {
    const { setStatus, markEvent } = useRealtimeStore.getState();
    const lojaIds = lojaIdsKey ? lojaIdsKey.split(",").map(Number) : [];
    if (lojaIds.length === 0) {
      setStatus("idle");
      return undefined;
    }

    const invalidate = (domains: readonly string[]) => {
      for (const domain of domains) void queryClient.invalidateQueries({ queryKey: [domain] });
    };

    const handleMessage = (message: RealtimeMessage) => {
      markEvent();
      switch (message.evento) {
        case "pedido.criado":
          invalidate(REALTIME_INVALIDATIONS.pedido);
          toast.info(t("realtime.pedidoCriado", { codigo: message.dados.codigo }));
          break;
        case "pedido.atualizado":
          invalidate(REALTIME_INVALIDATIONS.pedido);
          break;
        case "estoque.atualizado":
        case "estoque.abaixo_do_minimo":
          invalidate(REALTIME_INVALIDATIONS.estoque);
          if (message.dados.abaixo_do_minimo || message.evento === "estoque.abaixo_do_minimo") {
            toast.warning(t("realtime.estoqueBaixo", { produto: message.dados.produto_id }));
          }
          break;
        default:
          break;
      }
    };

    const statuses = new Map<number, ConnectionStatus>();
    const clients = lojaIds.map(
      (id) =>
        new RealtimeClient({
          url: `${publicEnv.NEXT_PUBLIC_WS_URL}${WS_CHANNELS.loja(id)}`,
          getToken: () => authService.getRealtimeToken(),
          onMessage: handleMessage,
          onStatusChange: (status) => {
            statuses.set(id, status);
            setStatus(combineStatuses([...statuses.values()]));
          },
        }),
    );
    for (const client of clients) void client.connect();
    return () => {
      for (const client of clients) client.disconnect();
    };
  }, [lojaIdsKey, queryClient, t]);

  return children;
}
