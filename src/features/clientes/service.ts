import { clientesApi, enderecosApi } from "@/services/api";
import type { Cliente, EnderecoCliente, Uf } from "@/types/api";
import { type ClienteFormValues, type EnderecoFormValues, isEnderecoEmpty } from "./schemas";

/**
 * Falha ao gravar o endereço depois que o cliente já foi salvo. Guarda o cliente para que
 * o formulário passe a editá-lo (evita criar o mesmo cliente duas vezes ao tentar de novo).
 */
export class EnderecoSaveError extends Error {
  constructor(
    readonly original: unknown,
    readonly cliente: Cliente,
  ) {
    super("Não foi possível salvar o endereço.");
    this.name = "EnderecoSaveError";
  }
}

/** Endereço que o formulário edita: o principal ou, sem principal, o primeiro. */
export function enderecoPrincipal(cliente?: Cliente | null): EnderecoCliente | undefined {
  return cliente?.enderecos.find((e) => e.principal) ?? cliente?.enderecos[0];
}

export function enderecoToForm(endereco?: EnderecoCliente): EnderecoFormValues {
  return {
    cep: endereco?.cep ?? "",
    endereco: endereco?.endereco ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    estado: endereco?.estado ?? "",
  };
}

interface SalvarClienteInput {
  id?: number;
  enderecoId?: number;
  values: ClienteFormValues;
}

/**
 * A API trata cliente e endereço em recursos separados (/clientes/ e /enderecos/),
 * então gravamos em sequência: primeiro o cliente, depois o endereço principal.
 */
export async function salvarCliente({ id, enderecoId, values }: SalvarClienteInput) {
  const { endereco, ...dados } = values;
  const cliente = id ? await clientesApi.update(id, dados) : await clientesApi.create(dados);
  if (isEnderecoEmpty(endereco)) return cliente;

  const payload = { ...endereco, estado: endereco.estado as Uf, cliente: cliente.id };
  try {
    if (enderecoId) await enderecosApi.update(enderecoId, payload);
    else await enderecosApi.create({ ...payload, principal: true });
  } catch (error) {
    throw new EnderecoSaveError(error, cliente);
  }
  return cliente;
}
