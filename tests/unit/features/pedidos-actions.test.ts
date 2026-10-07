import { describe, expect, it } from "vitest";
import {
  availableActions,
  canTransition,
  pedidoPodeMudarPara,
  separacaoEmAndamento,
} from "@/features/pedidos/actions";
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
    expect(
      availableActions(
        { status: "PENDENTE", tipo_entrega: "RETIRADA", separacoes: [] },
        "SEPARADOR",
      ),
    ).toEqual(["iniciarSeparacao", "cancelar"]);
    expect(
      availableActions(
        { status: "EM_SEPARACAO", tipo_entrega: "RETIRADA", separacoes: [emAndamento] },
        "SEPARADOR",
      ),
    ).toEqual(["concluirSeparacao", "cancelar"]);
    expect(
      availableActions(
        { status: "SEPARADO", tipo_entrega: "RETIRADA", separacoes: [] },
        "SEPARADOR",
      ),
    ).toEqual(["cancelar"]);
  });

  it("caixa finaliza pedidos separados", () => {
    expect(
      availableActions({ status: "SEPARADO", tipo_entrega: "RETIRADA", separacoes: [] }, "CAIXA"),
    ).toEqual(["finalizar", "cancelar"]);
    expect(
      availableActions({ status: "PENDENTE", tipo_entrega: "RETIRADA", separacoes: [] }, "CAIXA"),
    ).toEqual(["cancelar"]);
  });

  it("entrega em domicílio sai para entrega antes de ser finalizada", () => {
    const domicilio = { tipo_entrega: "DOMICILIO" as const, separacoes: [] };
    expect(availableActions({ ...domicilio, status: "SEPARADO" }, "CAIXA")).toEqual([
      "despachar",
      "cancelar",
    ]);
    expect(availableActions({ ...domicilio, status: "SAIU_PARA_ENTREGA" }, "CAIXA")).toEqual([
      "finalizar",
      "cancelar",
    ]);
    expect(availableActions({ ...domicilio, status: "SAIU_PARA_ENTREGA" }, "SEPARADOR")).toEqual([
      "cancelar",
    ]);
    expect(
      pedidoPodeMudarPara({ status: "SEPARADO", tipo_entrega: "RETIRADA" }, "SAIU_PARA_ENTREGA"),
    ).toBe(false);
    expect(
      pedidoPodeMudarPara({ status: "SEPARADO", tipo_entrega: "DOMICILIO" }, "FINALIZADO"),
    ).toBe(false);
  });

  it("sem ações em pedidos encerrados ou para perfis sem acesso", () => {
    expect(
      availableActions({ status: "FINALIZADO", tipo_entrega: "RETIRADA", separacoes: [] }, "ADMIN"),
    ).toEqual([]);
    expect(
      availableActions({ status: "PENDENTE", tipo_entrega: "RETIRADA", separacoes: [] }, "CLIENTE"),
    ).toEqual([]);
  });

  it("localiza a separação em andamento", () => {
    expect(separacaoEmAndamento({ separacoes: [emAndamento] })?.id).toBe(10);
    expect(
      separacaoEmAndamento({ separacoes: [{ ...emAndamento, status: "CONCLUIDA" }] }),
    ).toBeUndefined();
  });
});
