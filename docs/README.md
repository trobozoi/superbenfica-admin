# Documentação do Super Benfica Admin

Documentação técnica do painel administrativo. Para subir o projeto em poucos minutos, comece pelo [README da raiz](../README.md).

| Documento                                               | Quando ler                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Arquitetura](arquitetura.md)                           | Visão geral das camadas, estrutura de pastas e fluxo de dados.                           |
| [Autenticação e segurança](autenticacao-e-seguranca.md) | BFF, cookies httpOnly, renovação de token, CSRF, CSP e cabeçalhos.                       |
| [Perfis e permissões](permissoes.md)                    | O que cada perfil vê e faz, e como incluir uma permissão nova.                           |
| [Funcionalidades](funcionalidades.md)                   | Comportamento de cada tela, regras de negócio e endpoints usados.                        |
| [Integração com a API](integracao-api.md)               | Endpoints consumidos, paginação, formato de erros, uploads e limites de requisição.      |
| [Tempo real](tempo-real.md)                             | WebSocket, eventos, reconexão e invalidação de cache.                                    |
| [Desenvolvimento](desenvolvimento.md)                   | Ambiente, convenções de código, i18n e receitas (nova tela, novo endpoint, novo evento). |
| [Testes](testes.md)                                     | Testes de unidade, E2E contra a API real e cobertura.                                    |
| [Deploy](deploy.md)                                     | Docker, variáveis de ambiente, build de produção e checklist de publicação.              |
| [Solução de problemas](solucao-de-problemas.md)         | Erros conhecidos e como resolver.                                                        |

## Projetos relacionados

- **API Super Benfica** (`../superbenfica-api`): backend em Django REST + Channels. A referência dos endpoints fica em `superbenfica-api/docs/api.md` e `superbenfica-api/docs/openapi.yaml`.

## Convenções desta documentação

- Caminhos são relativos à raiz do repositório (ex.: `src/config/env.ts`).
- "API" é sempre o backend Django; "BFF" são as rotas `src/app/api/*` do próprio Next, que ficam entre o navegador e a API.
- Os nomes de perfis seguem a API: `ADMIN`, `GERENTE`, `SEPARADOR`, `CAIXA` e `CLIENTE`.
