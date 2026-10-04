import { hasPermission } from "@/config/permissions";
import type { ItemPedido, Pedido, PedidoStatus, Role, Separacao } from "@/types/api";

export type PedidoAction = "iniciarSeparacao" | "concluirSeparacao" | "finalizar" | "cancelar";

/** Espelho de TRANSICOES_PEDIDO (superbenfica-api/apps/pedidos/models.py). */
const TRANSITIONS: Record<PedidoStatus, readonly PedidoStatus[]> = {
  PENDENTE: ["EM_SEPARACAO", "CANCELADO"],
  EM_SEPARACAO: ["SEPARADO", "CANCELADO"],
  SEPARADO: ["FINALIZADO", "CANCELADO"],
  FINALIZADO: [],
  CANCELADO: [],
};

export function canTransition(from: PedidoStatus, to: PedidoStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function separacaoEmAndamento(pedido: Pick<Pedido, "separacoes">): Separacao | undefined {
  return pedido.separacoes.find((separacao) => separacao.status === "EM_ANDAMENTO");
}

/** Com separação em andamento, só conclui depois de todos os itens marcados no checklist. */
export function concluirBloqueado(
  pedido: Pick<Pedido, "separacoes"> & { itens: readonly Pick<ItemPedido, "separado">[] },
): boolean {
  return Boolean(separacaoEmAndamento(pedido)) && pedido.itens.some((item) => !item.separado);
}

/** Ações que o perfil pode executar no estado atual do pedido (na ordem do fluxo). */
export function availableActions(
  pedido: Pick<Pedido, "status" | "separacoes">,
  role: Role | null | undefined,
): PedidoAction[] {
  const actions: PedidoAction[] = [];
  const { status } = pedido;
  if (canTransition(status, "EM_SEPARACAO") && hasPermission(role, "separacao:operate")) {
    actions.push("iniciarSeparacao");
  }
  if (
    canTransition(status, "SEPARADO") &&
    separacaoEmAndamento(pedido) &&
    hasPermission(role, "separacao:operate")
  ) {
    actions.push("concluirSeparacao");
  }
  if (canTransition(status, "FINALIZADO") && hasPermission(role, "pedidos:finalize")) {
    actions.push("finalizar");
  }
  if (canTransition(status, "CANCELADO") && hasPermission(role, "pedidos:cancel")) {
    actions.push("cancelar");
  }
  return actions;
}
