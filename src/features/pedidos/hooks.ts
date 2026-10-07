"use client";

import { useApiMutation } from "@/hooks/use-resource";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { pedidosApi, separacoesApi } from "@/services/api";
import type { Pedido } from "@/types/api";
import { type PedidoAction, separacaoEmAndamento } from "./actions";

interface PedidoActionVariables {
  action: PedidoAction;
  pedido: Pedido;
}

function runAction({ action, pedido }: PedidoActionVariables): Promise<unknown> {
  switch (action) {
    case "iniciarSeparacao":
      return pedidosApi.iniciarSeparacao(pedido.id);
    case "concluirSeparacao": {
      const separacao = separacaoEmAndamento(pedido);
      if (!separacao) return Promise.reject(new Error("Nenhuma separação em andamento."));
      return separacoesApi.concluir(separacao.id);
    }
    case "despachar":
      return pedidosApi.despachar(pedido.id);
    case "finalizar":
      return pedidosApi.finalizar(pedido.id);
    case "cancelar":
      return pedidosApi.cancelar(pedido.id);
  }
}

/** Executa uma transição de status e atualiza pedidos, fila e relatórios. */
export function usePedidoAction(onSuccess?: () => void) {
  return useApiMutation<PedidoActionVariables, unknown>({
    mutationFn: runAction,
    invalidate: REALTIME_INVALIDATIONS.pedido,
    onSuccess,
  });
}
