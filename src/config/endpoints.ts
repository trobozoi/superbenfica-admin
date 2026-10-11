/**
 * Endpoints da API Django (relativos a /api/, sem barra final).
 * Fonte: superbenfica-api/docs/openapi.yaml. Confira lá ao adicionar rotas.
 *
 * No navegador as chamadas passam pelo BFF (/api/proxy/<endpoint>), que anexa o token
 * e adiciona a barra final exigida pelo Django.
 */
export const AUTH_ENDPOINTS = {
  token: "auth/token",
  refresh: "auth/token/refresh",
  logout: "auth/logout",
} as const;

export const ENDPOINTS = {
  usuarios: "usuarios",
  usuarioMe: "usuarios/me",
  lojas: "lojas",
  produtos: "produtos",
  produtoFoto: (id: number) => `produtos/${id}/foto`,
  estoques: "estoques",
  estoqueAjustar: (id: number) => `estoques/${id}/ajustar`,
  clientes: "clientes",
  enderecos: "enderecos",
  formasPagamento: "formas-pagamento",
  pedidos: "pedidos",
  pedidoCancelar: (id: number) => `pedidos/${id}/cancelar`,
  pedidoIniciarSeparacao: (id: number) => `pedidos/${id}/iniciar-separacao`,
  pedidoDespachar: (id: number) => `pedidos/${id}/despachar`,
  pedidoFinalizar: (id: number) => `pedidos/${id}/finalizar`,
  separacoes: "separacoes",
  separacaoConcluir: (id: number) => `separacoes/${id}/concluir`,
  separacaoMarcarItem: (id: number) => `separacoes/${id}/marcar-item`,
  relatorios: {
    vendas: "relatorios/vendas",
    maisVendidos: "relatorios/produtos-mais-vendidos",
    pedidosPorStatus: "relatorios/pedidos-por-status",
    estoqueBaixo: "relatorios/estoque-baixo",
  },
} as const;

/**
 * ViaCEP: consulta pública de endereço por CEP, chamada direto do navegador
 * (a API libera CORS). A origem também entra na CSP (connect-src) em src/proxy.ts.
 */
export const VIACEP = {
  origin: "https://viacep.com.br",
  url: (cep: string) => `https://viacep.com.br/ws/${cep}/json/`,
} as const;

/**
 * Open Food Facts: base pública de produtos por código de barras, chamada direto do
 * navegador (libera CORS). A origem também entra na CSP (connect-src) em src/proxy.ts.
 */
export const OPEN_FOOD_FACTS = {
  origin: "https://world.openfoodfacts.org",
  url: (gtin: string) =>
    `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=product_name,product_name_pt,quantity`,
} as const;

/**
 * CDN de imagens do Cosmos (Bluesoft). Não libera CORS: o navegador baixa a foto pelo
 * BFF (BFF_ROUTES.gtinFoto). A página do produto no Cosmos fica atrás do Cloudflare
 * e não pode ser lida pelo servidor; por isso o nome vem do Open Food Facts.
 */
export const COSMOS_CDN = {
  fotoUrl: (gtin: string) => `https://cdn-cosmos.bluesoft.com.br/products/${gtin}`,
} as const;

/** Canais WebSocket (Django Channels). */
export const WS_CHANNELS = {
  loja: (lojaId: number) => `/ws/lojas/${lojaId}/`,
  notificacoes: "/ws/notificacoes/",
} as const;

/** Rotas internas do BFF (Next route handlers). */
export const BFF_ROUTES = {
  proxy: "/api/proxy",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  refresh: "/api/auth/refresh",
  wsToken: "/api/auth/ws-token",
  /** Fotos servidas pela mesma origem do painel (veja app/api/media). */
  media: "/api/media",
  /** Foto do produto no Cosmos pelo código de barras (veja app/api/gtin). */
  gtinFoto: (gtin: string) => `/api/gtin/${gtin}/foto`,
} as const;

/** Tamanho de página fixo da API (REST_FRAMEWORK.PAGE_SIZE). */
export const API_PAGE_SIZE = 20;
