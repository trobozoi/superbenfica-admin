/**
 * Tipos do domínio, espelhando o schema OpenAPI da API Django
 * (superbenfica-api/docs/openapi.yaml). Valores decimais chegam como string.
 */

export const ROLES = ["ADMIN", "GERENTE", "SEPARADOR", "CAIXA", "CLIENTE"] as const;
export type Role = (typeof ROLES)[number];

export const CATEGORIAS = [
  "HORTIFRUTI",
  "MERCEARIA",
  "BEBIDAS",
  "LATICINIOS",
  "PADARIA",
  "ACOUGUE",
  "LIMPEZA",
  "HIGIENE",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const PEDIDO_STATUS = [
  "PENDENTE",
  "EM_SEPARACAO",
  "SEPARADO",
  "SAIU_PARA_ENTREGA",
  "FINALIZADO",
  "CANCELADO",
] as const;
export type PedidoStatus = (typeof PEDIDO_STATUS)[number];

export const SEPARACAO_STATUS = ["EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] as const;
export type SeparacaoStatus = (typeof SEPARACAO_STATUS)[number];

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListParams {
  page?: number;
  search?: string;
  ordering?: string;
  [filter: string]: string | number | boolean | undefined;
}

export interface Loja {
  id: number;
  nome: string;
  endereco: string;
  telefone?: string;
  horario_abertura: string;
  horario_fechamento: string;
  ativa?: boolean;
  data_criacao: string;
  data_atualizacao: string;
}
export type LojaInput = Omit<Loja, "id" | "data_criacao" | "data_atualizacao">;

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  loja: number | null;
  loja_nome: string;
  role: Role;
  is_active?: boolean;
  data_cadastro: string;
}
export interface UsuarioInput {
  nome: string;
  email: string;
  telefone?: string;
  loja: number | null;
  role: Role;
  is_active?: boolean;
  password?: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  categoria?: Categoria;
  preco: string;
  sku: string;
  /** GTIN (EAN-8/13, UPC-A ou GTIN-14). Vazio quando o produto não tem código. */
  codigo_barras?: string;
  ativo?: boolean;
  /** URL absoluta da foto (WebP) ou null. Enviada à parte, por multipart. */
  foto?: string | null;
  data_criacao: string;
  data_atualizacao: string;
}
export type ProdutoInput = Omit<Produto, "id" | "foto" | "data_criacao" | "data_atualizacao">;

export interface EstoqueLocal {
  id: number;
  produto: number;
  produto_nome: string;
  produto_sku: string;
  loja: number;
  loja_nome: string;
  quantidade: number;
  quantidade_minima: number;
  abaixo_do_minimo: boolean;
  data_atualizacao: string;
}
export interface EstoqueInput {
  produto: number;
  loja: number;
  quantidade: number;
  quantidade_minima: number;
}
export interface AjusteEstoqueInput {
  delta: number;
  motivo: string;
}

/** Unidades federativas aceitas pela API (EstadoEnum). */
export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export type Uf = (typeof UFS)[number];

export interface EnderecoCliente {
  id: number;
  cliente: number;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: Uf;
  cep: string;
  principal?: boolean;
}
export type EnderecoInput = Omit<EnderecoCliente, "id">;

export interface Cliente {
  id: number;
  usuario: number | null;
  nome: string;
  email: string;
  telefone?: string;
  loja: number | null;
  data_cadastro: string;
  enderecos: EnderecoCliente[];
}
export interface ClienteInput {
  nome: string;
  email: string;
  telefone?: string;
  loja: number | null;
}

export interface ItemPedido {
  id: number;
  produto: number;
  produto_nome: string;
  produto_sku: string;
  produto_codigo_barras: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
  /** Checklist da separação: item já colocado no pedido. */
  separado: boolean;
}

export interface Separacao {
  id: number;
  pedido: number;
  pedido_codigo: string;
  usuario: number;
  usuario_nome: string;
  status: SeparacaoStatus;
  data_inicio: string;
  data_conclusao: string | null;
}

/** Espelho de TipoEntrega (superbenfica-api/apps/pedidos/models.py). */
export const TIPOS_ENTREGA = ["RETIRADA", "DOMICILIO"] as const;
export type TipoEntrega = (typeof TIPOS_ENTREGA)[number];

export interface Pedido {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nome: string;
  loja: number;
  loja_nome: string;
  status: PedidoStatus;
  /** Null só em pedidos anteriores ao cadastro de formas de pagamento. */
  forma_pagamento: number | null;
  forma_pagamento_nome: string | null;
  tipo_entrega: TipoEntrega;
  /** Cópia do endereço no momento da compra (vazio na retirada). */
  endereco_entrega: string;
  observacao: string;
  itens: ItemPedido[];
  total: string;
  separacoes: Separacao[];
  data_criacao: string;
  data_atualizacao: string;
}
/** Espelho de TipoPagamento (superbenfica-api/apps/pagamentos/models.py). */
export const TIPOS_PAGAMENTO = [
  "PIX",
  "CREDITO",
  "DEBITO",
  "DINHEIRO",
  "VALE_ALIMENTACAO",
] as const;
export type TipoPagamento = (typeof TIPOS_PAGAMENTO)[number];

export interface FormaPagamento {
  id: number;
  nome: string;
  tipo: TipoPagamento;
  tipo_display: string;
  /** Cliente pode pedir troco (ex.: dinheiro). */
  permite_troco: boolean;
  ativa: boolean;
  /** Ordem de exibição nas listas (menor primeiro). */
  ordem: number;
  data_criacao: string;
  data_atualizacao: string;
}
export type FormaPagamentoInput = Pick<
  FormaPagamento,
  "nome" | "tipo" | "permite_troco" | "ativa" | "ordem"
>;

export interface PedidoInput {
  cliente?: number;
  loja: number;
  forma_pagamento: number;
  itens: { produto: number; quantidade: number }[];
  observacao?: string;
  tipo_entrega?: TipoEntrega;
  /** Id de um endereço do cliente; obrigatório na entrega em domicílio. */
  endereco?: number;
}

export interface VendasLoja {
  loja_id: number;
  loja: string;
  pedidos: number;
  faturamento: string;
  ticket_medio: string;
}
export interface ProdutoVendido {
  produto_id: number;
  produto: string;
  sku: string;
  quantidade: number;
  faturamento: string;
}
export type PedidosPorStatus = Record<PedidoStatus, number>;
export interface EstoqueBaixo {
  loja_id: number;
  loja_nome: string;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  quantidade_minima: number;
}
export interface RelatorioParams {
  loja?: number;
  inicio?: string;
  fim?: string;
  limite?: number;
}
