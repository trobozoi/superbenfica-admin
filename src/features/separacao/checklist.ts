import { hasPermission } from "@/config/permissions";
import { separacaoEmAndamento } from "@/features/pedidos/actions";
import { limparCodigoBarras } from "@/lib/gtin";
import type { ItemPedido, Pedido, Role } from "@/types/api";

export interface ProgressoChecklist {
  feitos: number;
  total: number;
  completo: boolean;
}

/** Quantos itens (linhas do pedido) já foram marcados como separados. */
export function progressoChecklist(
  itens: readonly Pick<ItemPedido, "separado">[],
): ProgressoChecklist {
  const feitos = itens.filter((item) => item.separado).length;
  return { feitos, total: itens.length, completo: itens.length > 0 && feitos === itens.length };
}

/**
 * Item do pedido correspondente ao código lido: primeiro pelo código de barras;
 * se não houver, pelo SKU (útil para produtos sem código ou etiqueta interna).
 */
export function itemPorCodigo<T extends Pick<ItemPedido, "produto_codigo_barras" | "produto_sku">>(
  itens: readonly T[],
  lido: string,
): T | undefined {
  const digitos = limparCodigoBarras(lido);
  const porCodigo = digitos
    ? itens.find((item) => item.produto_codigo_barras === digitos)
    : undefined;
  const sku = lido.trim().toUpperCase();
  return porCodigo ?? itens.find((item) => sku !== "" && item.produto_sku === sku);
}

/**
 * Quem pode marcar itens: o separador responsável ou a gestão (ADMIN/GERENTE),
 * com a separação em andamento. A API aplica a mesma regra.
 */
export function podeMarcarItens(
  pedido: Pick<Pedido, "separacoes">,
  user: { id: number; role: Role } | null | undefined,
): boolean {
  const separacao = separacaoEmAndamento(pedido);
  if (!separacao || !user || !hasPermission(user.role, "separacao:operate")) return false;
  return separacao.usuario === user.id || hasPermission(user.role, "separacao:supervise");
}
