# Changelog

Todas as mudanças relevantes do painel são registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- **Forma de entrega dos pedidos** (requer a API com o campo `tipo_entrega`, migração `pedidos.0005`):
  - coluna "Entrega" e filtro por retirada na loja ou entrega em domicílio na lista de pedidos;
  - forma de entrega e endereço de entrega no detalhe do pedido;
  - selo e endereço nos cartões da fila de separação quando o pedido é para entrega;
  - no novo pedido, escolha entre retirada e entrega em domicílio; na entrega, o endereço é escolhido entre os cadastrados do cliente (o principal vem selecionado).
- **Status "Saiu para entrega"** (requer a API com o status `SAIU_PARA_ENTREGA`, migração `pedidos.0006`): pedidos de entrega em domicílio separados ganham o botão "Saiu para entrega" e só são finalizados depois dele; a retirada na loja continua sendo finalizada direto. O status entra no filtro, no gráfico e nos pedidos em aberto, e o dashboard operacional ganha o cartão "Saíram para entrega".

### Corrigido

- ADMIN em "Todas as filiais" não recebia atualizações em tempo real: pedidos novos só apareciam ao recarregar a página. Agora o painel escuta o canal de cada filial ativa.

## [1.0.0] - 2026-10-03

Primeira versão estável do painel administrativo.

### Adicionado

- **Autenticação (padrão BFF):**
  - JWT guardado só em cookies httpOnly;
  - renovação de sessão única para requisições simultâneas;
  - proteção CSRF e CSP com nonce;
  - guarda de rotas por perfil no `proxy.ts`;
  - perfil `CLIENTE` barrado no login;
  - opção "Salvar senha neste navegador", que usa o gerenciador de senhas do navegador e lembra só o e-mail no painel.
- **Perfis e permissões:** matriz para ADMIN, GERENTE, SEPARADOR e CAIXA, aplicada nas rotas, no menu e nas ações. O ADMIN escolhe a filial no topo.
- **Dashboard:** visão de gestão (KPIs de vendas, pedidos por status, mais vendidos, estoque baixo) e visão operacional (contagem da fila).
- **Pedidos:**
  - novo pedido com busca de cliente e produto dentro da lista e forma de pagamento obrigatória;
  - ações do fluxo (iniciar separação, concluir, finalizar, cancelar);
  - detalhe do pedido.
- **Fila de separação:**
  - checklist dos itens, gravado na API e atualizado em tempo real;
  - marcação pelo leitor de código de barras (ou pelo SKU);
  - conclusão liberada só com todos os itens marcados.
- **Produtos:**
  - código de barras com validação GTIN;
  - foto (JPEG, PNG ou WebP, servida pela mesma origem);
  - estoque inicial e quantidade mínima por filial;
  - importação por CSV.
- **Estoque:** saldos por filial, filtro de abaixo do mínimo e ajuste com motivo.
- **Clientes:** endereço preenchido pelo CEP (ViaCEP), telefone com máscara, UF com busca e histórico de compras.
- **Relatórios:** vendas por filial, produtos mais vendidos e estoque abaixo do mínimo, por período.
- **Formas de pagamento:** cadastro (Pix, cartões, dinheiro com troco, vale-alimentação), com ordem de exibição e desativação.
- **Configurações:** usuários, filiais e a matriz de permissões.
- **Tempo real:** WebSocket nativo (Django Channels), com reconexão e invalidação automática do cache.
- **Qualidade:**
  - testes de unidade (Vitest) e E2E contra a API real (Playwright);
  - ESLint com as regras do SonarJS;
  - Husky com lint-staged;
  - CI no GitHub Actions com SonarQube.
- **Deploy:** imagem Docker multi-stage (`standalone`, usuário sem privilégios) e `docker-compose` para desenvolvimento.
- **Documentação:** pasta `docs/` com arquitetura, segurança, permissões, funcionalidades, integração, tempo real, desenvolvimento, testes, deploy e solução de problemas.

### Requisitos

- A API Super Benfica com formas de pagamento, código de barras e checklist da separação (`pedidos 0004`, `produtos 0003`, `pagamentos 0002`).
- Redis na API, com `CHANNEL_LAYER_SOCKET_TIMEOUT` maior que 5 s, para o tempo real.

[1.0.0]: https://github.com/trobozoi/superbenfica-admin/releases/tag/v1.0.0
