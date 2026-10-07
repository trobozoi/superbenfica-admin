import { hasPermission } from "@/config/permissions";
import type { ItemPedido, Pedido, PedidoStatus, Role, Separacao } from "@/types/api";

export type PedidoAction =
  "iniciarSeparacao" | "concluirSeparacao" | "despachar" | "finalizar" | "cancelar";

/** Espelho de TRANSICOES_PEDIDO (superbenfica-api/apps/pedidos/models.py). */
const TRANSITIONS: Record<PedidoStatus, readonly PedidoStatus[]> = {
  PENDENTE: ["EM_SEPARACAO", "CANCELADO"],
  EM_SEPARACAO: ["SEPARADO", "CANCELADO"],
  SEPARADO: ["SAIU_PARA_ENTREGA", "FINALIZADO", "CANCELADO"],
  SAIU_PARA_ENTREGA: ["FINALIZADO", "CANCELADO"],
  FINALIZADO: [],
  CANCELADO: [],
};

export function canTransition(from: PedidoStatus, to: PedidoStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Espelho de Pedido.pode_mudar_para: separado, o pedido de entrega em domicílio só sai
 * para entrega, e o de retirada na loja só é finalizado.
 */
export function pedidoPodeMudarPara(
  pedido: Pick<Pedido, "status" | "tipo_entrega">,
  to: PedidoStatus,
): boolean {
  if (!canTransition(pedido.status, to)) return false;
  if (pedido.status !== "SEPARADO" || to === "CANCELADO") return true;
  return to === (pedido.tipo_entrega === "DOMICILIO" ? "SAIU_PARA_ENTREGA" : "FINALIZADO");
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
  pedido: Pick<Pedido, "status" | "tipo_entrega" | "separacoes">,
  role: Role | null | undefined,
): PedidoAction[] {
  const actions: PedidoAction[] = [];
  const pode = (to: PedidoStatus) => pedidoPodeMudarPara(pedido, to);
  if (pode("EM_SEPARACAO") && hasPermission(role, "separacao:operate")) {
    actions.push("iniciarSeparacao");
  }
  if (
    pode("SEPARADO") &&
    separacaoEmAndamento(pedido) &&
    hasPermission(role, "separacao:operate")
  ) {
    actions.push("concluirSeparacao");
  }
  if (pode("SAIU_PARA_ENTREGA") && hasPermission(role, "pedidos:finalize")) {
    actions.push("despachar");
  }
  if (pode("FINALIZADO") && hasPermission(role, "pedidos:finalize")) {
    actions.push("finalizar");
  }
  if (pode("CANCELADO") && hasPermission(role, "pedidos:cancel")) {
    actions.push("cancelar");
  }
  return actions;
}
