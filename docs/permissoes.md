# Perfis e permissões

A matriz fica em `src/config/permissions.ts` e espelha as regras da API (`superbenfica-api/docs/api.md`). Ela é usada em três lugares:

1. `src/proxy.ts`: bloqueia rotas (`ROUTE_PERMISSIONS`) e manda para `/acesso-negado`;
2. a sidebar (`src/config/navigation.ts`): só mostra os itens permitidos;
3. o componente `<Can permission="...">`, o hook `usePermission(...)` e as regras das features (`hasPermission`): escondem botões e ações.

> **A API é a autoridade final.** A matriz do painel só decide o que aparece. Se a API recusar, o erro (403) é mostrado ao usuário.

## Perfis

| Perfil      | Quem é                  | Filial                                              |
| ----------- | ----------------------- | --------------------------------------------------- |
| `ADMIN`     | administrador da rede   | escolhe a filial no topo (ou vê todas)              |
| `GERENTE`   | gestor de uma filial    | sempre a própria                                    |
| `SEPARADOR` | monta os pedidos        | sempre a própria                                    |
| `CAIXA`     | atendimento e pagamento | sempre a própria                                    |
| `CLIENTE`   | consumidor (app/site)   | **não acessa o painel**: o login é recusado com 403 |

## Matriz

Grupos usados no código: **Gestão** = ADMIN e GERENTE; **Venda** = ADMIN, GERENTE e CAIXA; **Separação** = ADMIN, GERENTE e SEPARADOR; **Equipe** = todos os funcionários.

| Permissão             | ADMIN | GERENTE | SEPARADOR | CAIXA | Uso                                                       |
| --------------------- | :---: | :-----: | :-------: | :---: | --------------------------------------------------------- |
| `dashboard:view`      |   ✓   |    ✓    |     ✓     |   ✓   | dashboard (e rotas sem regra própria)                     |
| `relatorios:view`     |   ✓   |    ✓    |           |       | /relatorios e o dashboard de gestão                       |
| `produtos:view`       |   ✓   |    ✓    |     ✓     |   ✓   | /produtos                                                 |
| `produtos:write`      |   ✓   |    ✓    |           |       | criar, editar, desativar, importar CSV, fotos             |
| `estoque:view`        |   ✓   |    ✓    |     ✓     |   ✓   | /estoque                                                  |
| `estoque:write`       |   ✓   |    ✓    |           |       | ajuste de estoque                                         |
| `pedidos:view`        |   ✓   |    ✓    |     ✓     |   ✓   | /pedidos                                                  |
| `pedidos:create`      |   ✓   |    ✓    |           |   ✓   | novo pedido                                               |
| `pedidos:finalize`    |   ✓   |    ✓    |           |   ✓   | finalizar pedido separado                                 |
| `pedidos:cancel`      |   ✓   |    ✓    |     ✓     |   ✓   | cancelar pedido                                           |
| `separacao:view`      |   ✓   |    ✓    |     ✓     |       | /separacao                                                |
| `separacao:operate`   |   ✓   |    ✓    |     ✓     |       | iniciar e concluir separação, marcar itens                |
| `separacao:supervise` |   ✓   |    ✓    |           |       | mexer na separação de outro separador                     |
| `clientes:view`       |   ✓   |    ✓    |     ✓     |   ✓   | /clientes                                                 |
| `clientes:create`     |   ✓   |    ✓    |           |   ✓   | novo cliente                                              |
| `clientes:write`      |   ✓   |    ✓    |           |       | editar cliente                                            |
| `usuarios:manage`     |   ✓   |    ✓    |           |       | reservada; hoje a aba Usuários segue `configuracoes:view` |
| `filiais:write`       |   ✓   |         |           |       | cadastrar e editar filiais                                |
| `filiais:switch`      |   ✓   |         |           |       | reservada; hoje o seletor verifica `role === "ADMIN"`     |
| `configuracoes:view`  |   ✓   |    ✓    |           |       | /configuracoes                                            |
| `pagamentos:view`     |   ✓   |    ✓    |           |       | /formas-pagamento                                         |
| `pagamentos:write`    |   ✓   |         |           |       | cadastrar, editar e desativar formas de pagamento         |
| `promocoes:view`      |   ✓   |    ✓    |           |       | /promocoes                                                |

A aba **Permissões** em Configurações mostra esta mesma matriz, gerada a partir do código.

## Regras que dependem do contexto

Algumas ações dependem do estado do registro, além do perfil:

- **Ações do pedido** (`availableActions` em `src/features/pedidos/actions.ts`):
  - seguem as transições da API: `PENDENTE → EM_SEPARACAO → SEPARADO → FINALIZADO`, com `CANCELADO` possível até `SEPARADO`;
  - concluir a separação exige uma separação em andamento;
  - concluir fica bloqueado até todos os itens do checklist estarem marcados (`concluirBloqueado`).
- **Checklist da separação** (`podeMarcarItens` em `src/features/separacao/checklist.ts`): só o separador responsável, ou ADMIN/GERENTE (`separacao:supervise`), com a separação em andamento.
- **Filial:** funcionários só veem e gravam na própria filial; o painel já preenche e trava o campo. O ADMIN escolhe.

## Rotas protegidas

| Prefixo             | Permissão exigida    |
| ------------------- | -------------------- |
| `/produtos`         | `produtos:view`      |
| `/estoque`          | `estoque:view`       |
| `/pedidos`          | `pedidos:view`       |
| `/separacao`        | `separacao:view`     |
| `/clientes`         | `clientes:view`      |
| `/relatorios`       | `relatorios:view`    |
| `/promocoes`        | `promocoes:view`     |
| `/configuracoes`    | `configuracoes:view` |
| `/formas-pagamento` | `pagamentos:view`    |
| qualquer outra      | `dashboard:view`     |

## Como incluir uma permissão ou perfil

**Nova permissão:**

1. Adicione a chave em `PERMISSIONS` (`src/config/permissions.ts`) com os perfis que podem usá-la.
2. Se for uma rota, adicione o prefixo em `ROUTE_PERMISSIONS` e, se tiver menu, o item em `src/config/navigation.ts` (com o rótulo em `nav` no `src/messages/pt-BR.json`).
3. Use `<Can permission="...">` ou `usePermission("...")` na interface.
4. Inclua a regra em `tests/unit/config/permissions.test.ts`.

**Novo perfil** (ex.: um "Visualizador" que a API ainda não tem):

1. Crie o perfil na API primeiro.
2. Adicione-o em `ROLES` (`src/types/api.ts`) e, se for da equipe, em `STAFF_ROLES`.
3. Inclua-o nos grupos ou nas permissões que fizerem sentido e adicione o nome em `roles` no `pt-BR.json`.
