import { ENDPOINTS } from "@/config/endpoints";
import type {
  AjusteEstoqueInput,
  Cliente,
  ClienteInput,
  EstoqueBaixo,
  EstoqueInput,
  EnderecoCliente,
  EnderecoInput,
  EstoqueLocal,
  FormaPagamento,
  FormaPagamentoInput,
  Loja,
  LojaInput,
  Pedido,
  PedidoInput,
  PedidosPorStatus,
  Produto,
  ProdutoInput,
  ProdutoVendido,
  RelatorioParams,
  ItemPedido,
  Separacao,
  Usuario,
  UsuarioInput,
  VendasLoja,
} from "@/types/api";
import { http } from "./http/client";
import { cleanParams, createResource } from "./resource";

export const lojasApi = createResource<Loja, LojaInput>(ENDPOINTS.lojas);
export const usuariosApi = createResource<Usuario, UsuarioInput>(ENDPOINTS.usuarios);
export const produtosApi = {
  ...createResource<Produto, ProdutoInput>(ENDPOINTS.produtos),
  /** Multipart com o campo "foto"; a API valida e converte para WebP. */
  enviarFoto: async (id: number, foto: File) => {
    const form = new FormData();
    form.append("foto", foto);
    return (await http.post<Produto>(ENDPOINTS.produtoFoto(id), form)).data;
  },
  removerFoto: async (id: number) => {
    await http.delete(ENDPOINTS.produtoFoto(id));
  },
};
export const formasPagamentoApi = createResource<FormaPagamento, FormaPagamentoInput>(
  ENDPOINTS.formasPagamento,
);
export const clientesApi = createResource<Cliente, ClienteInput>(ENDPOINTS.clientes);
export const enderecosApi = createResource<EnderecoCliente, EnderecoInput>(ENDPOINTS.enderecos);

export const estoquesApi = {
  ...createResource<EstoqueLocal, EstoqueInput>(ENDPOINTS.estoques),
  ajustar: async (id: number, input: AjusteEstoqueInput) =>
    (await http.post<EstoqueLocal>(ENDPOINTS.estoqueAjustar(id), input)).data,
};

const pedidosBase = createResource<Pedido, PedidoInput>(ENDPOINTS.pedidos);
const postPedidoAction = async (path: string) => (await http.post<Pedido>(path)).data;

/** Pedidos não são editados nem apagados: mudam de status pelas ações abaixo. */
export const pedidosApi = {
  name: pedidosBase.name,
  list: pedidosBase.list,
  get: pedidosBase.get,
  create: pedidosBase.create,
  cancelar: (id: number) => postPedidoAction(ENDPOINTS.pedidoCancelar(id)),
  /** Responde com a Separacao criada (201), não com o pedido. */
  iniciarSeparacao: async (id: number) =>
    (await http.post<Separacao>(ENDPOINTS.pedidoIniciarSeparacao(id))).data,
  finalizar: (id: number) => postPedidoAction(ENDPOINTS.pedidoFinalizar(id)),
};

const separacoesBase = createResource<Separacao, never>(ENDPOINTS.separacoes);
export const separacoesApi = {
  name: separacoesBase.name,
  list: separacoesBase.list,
  concluir: async (id: number) =>
    (await http.post<Separacao>(ENDPOINTS.separacaoConcluir(id))).data,
  /** Checklist: marca (ou desmarca) um item do pedido como já separado. */
  marcarItem: async (id: number, item: number, separado: boolean) =>
    (await http.post<ItemPedido>(ENDPOINTS.separacaoMarcarItem(id), { item, separado })).data,
};

const getReport =
  <T>(endpoint: string) =>
  async (params?: RelatorioParams): Promise<T> =>
    (await http.get<T>(endpoint, { params: cleanParams({ ...params }) })).data;

export const relatoriosApi = {
  vendas: getReport<VendasLoja[]>(ENDPOINTS.relatorios.vendas),
  maisVendidos: getReport<ProdutoVendido[]>(ENDPOINTS.relatorios.maisVendidos),
  pedidosPorStatus: getReport<PedidosPorStatus>(ENDPOINTS.relatorios.pedidosPorStatus),
  estoqueBaixo: getReport<EstoqueBaixo[]>(ENDPOINTS.relatorios.estoqueBaixo),
};
