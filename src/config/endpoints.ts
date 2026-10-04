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
} as const;

/** Tamanho de página fixo da API (REST_FRAMEWORK.PAGE_SIZE). */
export const API_PAGE_SIZE = 20;
