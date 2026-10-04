import { afterEach, describe, expect, it, vi } from "vitest";
import { clienteSchema, EMPTY_ENDERECO, isEnderecoEmpty } from "@/features/clientes/schemas";
import {
  EnderecoSaveError,
  enderecoPrincipal,
  enderecoToForm,
  salvarCliente,
} from "@/features/clientes/service";
import { clientesApi, enderecosApi } from "@/services/api";
import type { Cliente, EnderecoCliente } from "@/types/api";

const ENDERECO = {
  cep: "60020-181",
  endereco: "Avenida da Universidade",
  numero: "2850",
  complemento: "",
  bairro: "Benfica",
  cidade: "Fortaleza",
  estado: "CE" as const,
};

const base = { nome: "Ana", email: "ana@exemplo.com", telefone: "", loja: "" };

const cliente: Cliente = {
  id: 7,
  usuario: null,
  nome: "Ana",
  email: "ana@exemplo.com",
  loja: null,
  data_cadastro: "2026-10-02T00:00:00Z",
  enderecos: [],
};

const salvo: EnderecoCliente = { id: 3, cliente: 7, principal: true, ...ENDERECO };

describe("features/clientes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("endereço é opcional quando nada foi preenchido", () => {
    const result = clienteSchema.parse({ ...base, endereco: EMPTY_ENDERECO });
    expect(isEnderecoEmpty(result.endereco)).toBe(true);
  });

  it("endereço parcial exige os campos obrigatórios da API", () => {
    const result = clienteSchema.safeParse({
      ...base,
      endereco: { ...EMPTY_ENDERECO, cep: "60020-181", endereco: "Rua X" },
    });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join("."));
    expect(fields).toEqual([
      "endereco.numero",
      "endereco.bairro",
      "endereco.cidade",
      "endereco.estado",
    ]);
  });

  it("valida o formato do CEP", () => {
    const result = clienteSchema.safeParse({ ...base, endereco: { ...ENDERECO, cep: "6002" } });
    expect(result.error?.issues[0]).toMatchObject({ path: ["endereco", "cep"], message: "cep" });
    expect(clienteSchema.safeParse({ ...base, endereco: ENDERECO }).success).toBe(true);
  });

  it("usa o endereço principal (ou o primeiro) no formulário", () => {
    const outro = { ...salvo, id: 4, principal: false };
    expect(enderecoPrincipal({ ...cliente, enderecos: [outro, salvo] })?.id).toBe(3);
    expect(enderecoPrincipal({ ...cliente, enderecos: [outro] })?.id).toBe(4);
    expect(enderecoPrincipal(null)).toBeUndefined();
    expect(enderecoToForm(undefined)).toEqual(EMPTY_ENDERECO);
    expect(enderecoToForm(salvo).cidade).toBe("Fortaleza");
  });

  it("cria o cliente e depois o endereço principal", async () => {
    const create = vi.spyOn(clientesApi, "create").mockResolvedValue(cliente);
    const createEndereco = vi.spyOn(enderecosApi, "create").mockResolvedValue(salvo);
    const values = clienteSchema.parse({ ...base, endereco: ENDERECO });

    await expect(salvarCliente({ values })).resolves.toEqual(cliente);
    expect(create).toHaveBeenCalledWith({ ...base, loja: null });
    expect(createEndereco).toHaveBeenCalledWith({ ...ENDERECO, cliente: 7, principal: true });
  });

  it("na edição atualiza o endereço existente e não grava endereço vazio", async () => {
    vi.spyOn(clientesApi, "update").mockResolvedValue(cliente);
    const update = vi.spyOn(enderecosApi, "update").mockResolvedValue(salvo);
    const createEndereco = vi.spyOn(enderecosApi, "create");

    await salvarCliente({
      id: 7,
      enderecoId: 3,
      values: clienteSchema.parse({ ...base, endereco: ENDERECO }),
    });
    expect(update).toHaveBeenCalledWith(3, { ...ENDERECO, cliente: 7 });

    await salvarCliente({
      id: 7,
      values: clienteSchema.parse({ ...base, endereco: EMPTY_ENDERECO }),
    });
    expect(createEndereco).not.toHaveBeenCalled();
  });

  it("falha do endereço preserva o cliente já criado", async () => {
    vi.spyOn(clientesApi, "create").mockResolvedValue(cliente);
    const apiError = new Error("400");
    vi.spyOn(enderecosApi, "create").mockRejectedValue(apiError);

    const error = await salvarCliente({
      values: clienteSchema.parse({ ...base, endereco: ENDERECO }),
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(EnderecoSaveError);
    expect(error).toMatchObject({ cliente, original: apiError });
  });
});
