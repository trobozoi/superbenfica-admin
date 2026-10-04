"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { publicEnv } from "@/config/env";
import { WS_CHANNELS } from "@/config/endpoints";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { RealtimeClient } from "@/lib/realtime/realtime-client";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { resolveLojaId, useFilialStore } from "@/store/filial-store";
import { useRealtimeStore } from "@/store/realtime-store";
import type { RealtimeMessage } from "@/types/realtime";

/**
 * Mantém a conexão WebSocket com o canal da filial e traduz eventos em
 * invalidações do TanStack Query: as telas abertas se atualizam sozinhas.
 */
export function RealtimeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const user = useAuthStore((state) => state.user);
  const selectedLojaId = useFilialStore((state) => state.selectedLojaId);
  const lojaId = resolveLojaId(user, selectedLojaId);

  useEffect(() => {
    const { setStatus, markEvent } = useRealtimeStore.getState();
    if (lojaId === null) {
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

    const client = new RealtimeClient({
      url: `${publicEnv.NEXT_PUBLIC_WS_URL}${WS_CHANNELS.loja(lojaId)}`,
      getToken: () => authService.getRealtimeToken(),
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });
    void client.connect();
    return () => client.disconnect();
  }, [lojaId, queryClient, t]);

  return children;
}
