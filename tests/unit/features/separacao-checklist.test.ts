import { describe, expect, it } from "vitest";
import { concluirBloqueado } from "@/features/pedidos/actions";
import { itemPorCodigo, podeMarcarItens, progressoChecklist } from "@/features/separacao/checklist";
import type { Separacao } from "@/types/api";

const separacao: Separacao = {
  id: 10,
  pedido: 1,
  pedido_codigo: "PED-1",
  usuario: 3,
  usuario_nome: "Separador",
  status: "EM_ANDAMENTO",
  data_inicio: "2026-10-03T10:00:00Z",
  data_conclusao: null,
};

const itens = [
  { id: 1, produto_sku: "ARZ-5", produto_codigo_barras: "7891000315507", separado: true },
  { id: 2, produto_sku: "FEJ-1", produto_codigo_barras: "", separado: false },
];

describe("features/separacao/checklist", () => {
  it("calcula o progresso", () => {
    expect(progressoChecklist(itens)).toEqual({ feitos: 1, total: 2, completo: false });
    expect(progressoChecklist(itens.map((item) => ({ ...item, separado: true })))).toMatchObject({
      completo: true,
    });
    expect(progressoChecklist([]).completo).toBe(false);
  });

  it("encontra o item pelo código de barras ou, sem código, pelo SKU", () => {
    expect(itemPorCodigo(itens, " 7891000315507\n")?.id).toBe(1);
    expect(itemPorCodigo(itens, "fej-1")?.id).toBe(2);
    expect(itemPorCodigo(itens, "7890000000000")).toBeUndefined();
    expect(itemPorCodigo(itens, "   ")).toBeUndefined();
  });

  it("só o separador responsável ou a gestão marcam itens", () => {
    const pedido = { separacoes: [separacao] };
    expect(podeMarcarItens(pedido, { id: 3, role: "SEPARADOR" })).toBe(true);
    expect(podeMarcarItens(pedido, { id: 4, role: "SEPARADOR" })).toBe(false);
    expect(podeMarcarItens(pedido, { id: 9, role: "GERENTE" })).toBe(true);
    expect(podeMarcarItens(pedido, { id: 3, role: "CAIXA" })).toBe(false);
    expect(podeMarcarItens({ separacoes: [] }, { id: 3, role: "SEPARADOR" })).toBe(false);
    expect(podeMarcarItens(pedido, null)).toBe(false);
  });

  it("bloqueia a conclusão enquanto houver item sem marcar", () => {
    expect(concluirBloqueado({ separacoes: [separacao], itens })).toBe(true);
    const todos = itens.map((item) => ({ ...item, separado: true }));
    expect(concluirBloqueado({ separacoes: [separacao], itens: todos })).toBe(false);
    expect(concluirBloqueado({ separacoes: [], itens })).toBe(false);
  });
});
