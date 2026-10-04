import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_STATUS, parseDrfErrorBody, toApiError } from "@/services/http/errors";

function axiosErrorWith(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("erro", "ERR", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("services/http/errors", () => {
  it("usa o detail do DRF como mensagem", () => {
    expect(parseDrfErrorBody(403, { detail: "Sem permissão." })).toEqual({
      status: 403,
      message: "Sem permissão.",
      fieldErrors: {},
    });
  });

  it("mapeia erros por campo e non_field_errors", () => {
    const error = parseDrfErrorBody(400, {
      sku: ["Já existe produto com este SKU."],
      preco: "Valor inválido.",
      non_field_errors: ["Dados inconsistentes."],
      code: "invalid",
    });
    expect(error.message).toBe("Dados inconsistentes.");
    expect(error.fieldErrors).toEqual({
      sku: "Já existe produto com este SKU.",
      preco: "Valor inválido.",
    });
  });

  it("usa o primeiro erro de campo quando não há mensagem geral", () => {
    expect(parseDrfErrorBody(400, { itens: [{ quantidade: ["Inválida."] }] }).message).toBe(
      "Inválida.",
    );
  });

  it("aceita texto, listas e ignora HTML de erro do servidor", () => {
    expect(parseDrfErrorBody(409, "Estoque insuficiente.").message).toBe("Estoque insuficiente.");
    expect(parseDrfErrorBody(400, ["Falhou."]).message).toBe("Falhou.");
    expect(parseDrfErrorBody(500, "<!DOCTYPE html>").message).toBe(
      "Não foi possível concluir a operação.",
    );
    expect(parseDrfErrorBody(400, { campo: [] }).message).toBe(
      "Não foi possível concluir a operação.",
    );
  });

  it("normaliza erros do axios, de rede e genéricos", () => {
    expect(toApiError(axiosErrorWith(409, { detail: "Conflito." })).message).toBe("Conflito.");
    expect(toApiError(new AxiosError("Network Error")).status).toBe(NETWORK_ERROR_STATUS);
    expect(toApiError(new Error("boom")).message).toBe("boom");
    expect(toApiError("x").message).toBe("Não foi possível concluir a operação.");
  });
});
