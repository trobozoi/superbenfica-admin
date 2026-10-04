import { estoquesApi, produtosApi } from "@/services/api";
import type { EstoqueLocal, Loja, Produto } from "@/types/api";
import type { ProdutoFormValues } from "./schemas";

/** Uma linha da seção "Estoque por filial" do formulário de produto. */
export interface EstoqueRow {
  loja: number;
  lojaNome: string;
  /** null = ainda não existe estoque deste produto nesta filial. */
  estoqueId: number | null;
  quantidade: number;
  quantidade_minima: number;
  /** Mínimo gravado na API, para só enviar o que mudou. */
  minimoAtual: number | null;
}

/**
 * Monta uma linha por filial. O ADMIN vê todas; os demais só a própria filial
 * (a API recusa alterar estoque de outra filial).
 */
export function buildEstoqueRows(
  lojas: readonly Loja[],
  estoques: readonly EstoqueLocal[],
  lojaRestrita: number | null,
): EstoqueRow[] {
  return lojas
    .filter((loja) => lojaRestrita === null || loja.id === lojaRestrita)
    .map((loja) => {
      const estoque = estoques.find((item) => item.loja === loja.id);
      return {
        loja: loja.id,
        lojaNome: loja.nome,
        estoqueId: estoque?.id ?? null,
        quantidade: estoque?.quantidade ?? 0,
        quantidade_minima: estoque?.quantidade_minima ?? 0,
        minimoAtual: estoque?.quantidade_minima ?? null,
      };
    });
}

export type EtapaPosProduto = "estoque" | "foto";

/**
 * Falha numa etapa posterior (estoque ou foto) depois que o produto já foi salvo. Guarda
 * o produto para que o formulário passe a editá-lo em vez de criar um duplicado.
 */
export class ProdutoParcialError extends Error {
  constructor(
    readonly original: unknown,
    readonly produto: Produto,
    readonly etapa: EtapaPosProduto,
  ) {
    super(`Produto salvo, mas a etapa "${etapa}" falhou.`);
    this.name = "ProdutoParcialError";
  }
}

/** Alteração da foto: File = enviar nova, null = remover, undefined = não mexer. */
export type FotoAlteracao = File | null | undefined;

async function salvarEstoque(produto: number, row: EstoqueRow): Promise<void> {
  if (row.estoqueId === null) {
    await estoquesApi.create({
      produto,
      loja: row.loja,
      quantidade: row.quantidade,
      quantidade_minima: row.quantidade_minima,
    });
    return;
  }
  // O saldo de um estoque existente só muda pelo "Ajustar" (com motivo registrado).
  if (row.quantidade_minima !== row.minimoAtual) {
    await estoquesApi.update(row.estoqueId, { quantidade_minima: row.quantidade_minima });
  }
}

async function etapa<T>(produto: Produto, nome: EtapaPosProduto, run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    throw new ProdutoParcialError(error, produto, nome);
  }
}

/**
 * Grava o produto e, em seguida, o estoque de cada filial e a foto (recursos separados
 * na API: JSON em /produtos/, estoque em /estoques/ e foto em multipart).
 */
export async function salvarProduto(
  id: number | undefined,
  values: ProdutoFormValues,
  foto?: FotoAlteracao,
) {
  const { estoques, ...dados } = values;
  const produto = id ? await produtosApi.update(id, dados) : await produtosApi.create(dados);
  // Em sequência: são poucas filiais e respeita o limite de requisições da API.
  await etapa(produto, "estoque", async () => {
    for (const row of estoques) await salvarEstoque(produto.id, row);
  });
  if (foto) {
    return etapa(produto, "foto", () => produtosApi.enviarFoto(produto.id, foto));
  }
  if (foto === null && produto.foto) {
    await etapa(produto, "foto", () => produtosApi.removerFoto(produto.id));
    return { ...produto, foto: null };
  }
  return produto;
}
