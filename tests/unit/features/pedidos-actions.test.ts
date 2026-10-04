import { describe, expect, it } from "vitest";
import { availableActions, canTransition, separacaoEmAndamento } from "@/features/pedidos/actions";
import type { Separacao } from "@/types/api";

const emAndamento: Separacao = {
  id: 10,
  pedido: 1,
  pedido_codigo: "PED-1",
  usuario: 3,
  usuario_nome: "Separador",
  status: "EM_ANDAMENTO",
  data_inicio: "2026-10-02T10:00:00Z",
  data_conclusao: null,
};

describe("features/pedidos/actions", () => {
  it("segue a tabela de transições da API", () => {
    expect(canTransition("PENDENTE", "EM_SEPARACAO")).toBe(true);
    expect(canTransition("PENDENTE", "FINALIZADO")).toBe(false);
    expect(canTransition("FINALIZADO", "CANCELADO")).toBe(false);
  });

  it("separador inicia e conclui separações, mas não finaliza", () => {
    expect(availableActions({ status: "PENDENTE", separacoes: [] }, "SEPARADOR")).toEqual([
      "iniciarSeparacao",
      "cancelar",
    ]);
    expect(
      availableActions({ status: "EM_SEPARACAO", separacoes: [emAndamento] }, "SEPARADOR"),
    ).toEqual(["concluirSeparacao", "cancelar"]);
    expect(availableActions({ status: "SEPARADO", separacoes: [] }, "SEPARADOR")).toEqual([
      "cancelar",
    ]);
  });

  it("caixa finaliza pedidos separados", () => {
    expect(availableActions({ status: "SEPARADO", separacoes: [] }, "CAIXA")).toEqual([
      "finalizar",
      "cancelar",
    ]);
    expect(availableActions({ status: "PENDENTE", separacoes: [] }, "CAIXA")).toEqual(["cancelar"]);
  });

  it("sem ações em pedidos encerrados ou para perfis sem acesso", () => {
    expect(availableActions({ status: "FINALIZADO", separacoes: [] }, "ADMIN")).toEqual([]);
    expect(availableActions({ status: "PENDENTE", separacoes: [] }, "CLIENTE")).toEqual([]);
  });

  it("localiza a separação em andamento", () => {
    expect(separacaoEmAndamento({ separacoes: [emAndamento] })?.id).toBe(10);
    expect(
      separacaoEmAndamento({ separacoes: [{ ...emAndamento, status: "CONCLUIDA" }] }),
    ).toBeUndefined();
  });
});
