# Integração com a API

O painel consome a API Super Benfica (Django REST Framework). A referência completa dos endpoints é `superbenfica-api/docs/api.md` e `superbenfica-api/docs/openapi.yaml`. A documentação interativa fica em `<API_URL>/api/docs/`.

## Onde ficam os endpoints

`src/config/endpoints.ts` é o único lugar com caminhos da API:

| Constante        | Conteúdo                                                           |
| ---------------- | ------------------------------------------------------------------ |
| `AUTH_ENDPOINTS` | token, refresh e logout (usados só pelo servidor)                  |
| `ENDPOINTS`      | recursos REST, relativos a `/api/`, **sem barra final**            |
| `WS_CHANNELS`    | canais WebSocket                                                   |
| `BFF_ROUTES`     | rotas internas do Next (`/api/proxy`, `/api/auth/*`, `/api/media`) |
| `VIACEP`         | consulta pública de CEP                                            |
| `API_PAGE_SIZE`  | 20, o tamanho de página fixo da API                                |

O BFF acrescenta a barra final que o Django exige (`apiUrl()` em `src/lib/server/django.ts`). No código do navegador, escreva `"produtos"`, nunca `"produtos/"`.

## Endpoints usados pelo painel

| Recurso             | Endpoint                                                                             | Uso no painel                                      |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Usuários            | `usuarios`, `usuarios/me`                                                            | Configurações → Usuários                           |
| Filiais             | `lojas`                                                                              | seletor de filial, formulários, Configurações      |
| Produtos            | `produtos`, `produtos/{id}/foto`                                                     | Produtos, combobox do pedido                       |
| Estoque             | `estoques`, `estoques/{id}/ajustar`                                                  | Estoque, estoque por filial no cadastro de produto |
| Clientes            | `clientes`, `enderecos`                                                              | Clientes, combobox do pedido                       |
| Formas de pagamento | `formas-pagamento`                                                                   | Formas de pagamento, novo pedido                   |
| Pedidos             | `pedidos`, `pedidos/{id}/cancelar`, `.../iniciar-separacao`, `.../finalizar`         | Pedidos, Separação, Dashboard                      |
| Separações          | `separacoes/{id}/concluir`, `separacoes/{id}/marcar-item`                            | Separação                                          |
| Relatórios          | `relatorios/vendas`, `produtos-mais-vendidos`, `pedidos-por-status`, `estoque-baixo` | Dashboard e Relatórios                             |
| Mídia               | `/media/produtos/<arquivo>` (pelo `/api/media`)                                      | fotos de produto                                   |
| WebSocket           | `/ws/lojas/<id>/?token=`                                                             | tempo real                                         |

## Serviços no navegador

`src/services/api.ts` declara um serviço por recurso. O CRUD padrão vem de `createResource<T, TInput>(endpoint)` (`src/services/resource.ts`):

| Método              | Requisição            |
| ------------------- | --------------------- |
| `list(params)`      | `GET endpoint?params` |
| `get(id)`           | `GET endpoint/id`     |
| `create(input)`     | `POST endpoint`       |
| `update(id, input)` | `PATCH endpoint/id`   |
| `remove(id)`        | `DELETE endpoint/id`  |

`list` remove os filtros vazios (`cleanParams`) para não enviar `?search=&loja=`. Ações que não são CRUD (cancelar pedido, ajustar estoque, enviar foto, marcar item...) são métodos extras no mesmo serviço.

Os tipos de cada recurso ficam em `src/types/api.ts`, espelhando os serializers da API. Ao mudar um serializer no backend, atualize o tipo correspondente.

## Paginação

Toda listagem da API responde no formato do DRF:

```json
{ "count": 57, "next": "...", "previous": null, "results": [ ... ] }
```

- O tamanho da página é fixo em 20 (`REST_FRAMEWORK.PAGE_SIZE` na API). O painel envia só `?page=`.
- `DataTable` + `Pagination` (`src/components/shared`) calculam as páginas a partir de `count`.
- Para contar registros sem listar (ex.: o dashboard operacional), use `page=1` e leia `count`.

## Filtros e ordenação

Cada ViewSet da API declara os seus `filterset_fields`, `search_fields` e `ordering_fields`. Os principais usados aqui:

| Recurso            | Filtros                                        | Busca (`search`)                       | Ordenação                                         |
| ------------------ | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| `produtos`         | `categoria`, `ativo`, `codigo_barras`          | nome, SKU, código de barras, descrição | `nome`, `preco`, `data_criacao`                   |
| `pedidos`          | `status`, `loja`, `cliente`, `forma_pagamento` | código, nome do cliente                | `data_criacao`, `status`                          |
| `estoques`         | `loja`, `produto`, `abaixo_do_minimo`          | nome e SKU do produto                  | `quantidade`, `produto__nome`, `data_atualizacao` |
| `clientes`         | `loja`                                         | nome, e-mail, telefone                 | `nome`, `data_cadastro`                           |
| `usuarios`         | `role`, `loja`, `is_active`                    | nome, e-mail                           | `nome`, `data_cadastro`                           |
| `formas-pagamento` | `tipo`, `ativa`                                | nome                                   | `ordem`, `nome`                                   |
| `lojas`            | `ativa`                                        | nome, endereço                         | `nome`, `data_criacao`                            |

Um prefixo `-` inverte a ordenação (`ordering=-data_criacao`).

## Erros

`src/services/http/errors.ts` normaliza os formatos do DRF para `ApiError { status, message, fieldErrors }`:

| Resposta da API                        | Resultado                                   |
| -------------------------------------- | ------------------------------------------- |
| `{"detail": "..."}`                    | `message`                                   |
| `{"non_field_errors": ["..."]}`        | `message`                                   |
| `{"campo": ["..."], "outro": ["..."]}` | `fieldErrors` (e o primeiro vira `message`) |
| HTML ou corpo vazio                    | mensagem genérica                           |
| sem resposta (rede)                    | status `0`, "Sem conexão com o servidor"    |

`applyFieldErrors(setError, erro)` (`src/hooks/use-resource.ts`) leva os `fieldErrors` para o React Hook Form, e cada campo mostra o erro da API.

Códigos importantes:

| Código | Significado no painel                                                                         |
| ------ | --------------------------------------------------------------------------------------------- |
| 400    | dados inválidos (erros por campo)                                                             |
| 401    | access expirado: o painel renova a sessão uma vez e repete; se não der, volta para o login    |
| 403    | perfil sem permissão (a API é a autoridade)                                                   |
| 409    | conflito de regra: estoque insuficiente, transição de status inválida, separação já encerrada |
| 413    | corpo acima de 5 MB (barrado no BFF)                                                          |
| 429    | limite de requisições da API (veja abaixo)                                                    |
| 503    | API fora do ar (o BFF não conseguiu falar com ela)                                            |

O TanStack Query não repete erros 4xx.

## Limites de requisição (rate limit)

A API limita requisições por escopo (`superbenfica-api/config/settings/base.py`). Os valores são ajustáveis no `.env` da API:

| Escopo            | Padrão  | Afeta no painel                |
| ----------------- | ------- | ------------------------------ |
| `login`           | 5/min   | tela de login, testes E2E      |
| `jwt`             | 30/min  | renovação de token             |
| `user`            | 600/min | todas as chamadas autenticadas |
| `anon`            | 60/min  | chamadas sem login             |
| `pedidos_criacao` | 30/min  | novo pedido                    |
| `pedidos_fluxo`   | 120/min | ações do pedido e da separação |
| `estoque_ajuste`  | 60/min  | ajuste de estoque              |
| `upload`          | 20/min  | foto de produto                |
| `relatorios`      | 30/min  | dashboard e relatórios         |

Ao estourar o limite, a API responde **429** com `Retry-After`, e o BFF repassa esse cabeçalho. Na tela de login, o 429 vira "Muitas tentativas. Aguarde um minuto".

## Uploads

Fotos de produto vão por `produtosApi.enviarFoto(id, arquivo)`: um `POST multipart/form-data` com o campo `foto`.

- O painel valida o tipo (JPEG, PNG, WebP) e o tamanho (até 2 MB) antes de enviar (`src/features/produtos/foto.ts`).
- O BFF encaminha os bytes sem convertê-los e recusa corpos acima de 5 MB.
- A API valida pelo conteúdo (não pela extensão), converte para WebP com no máximo 1200 px e remove os metadados (EXIF/GPS).
- `produtosApi.removerFoto(id)` apaga a foto.

## Serviços externos

| Serviço | Uso                                      | Observação                                                   |
| ------- | ---------------------------------------- | ------------------------------------------------------------ |
| ViaCEP  | preencher o endereço do cliente pelo CEP | chamado direto do navegador; liberado na CSP (`connect-src`) |
