# Desenvolvimento

## Ambiente

| Ferramenta | Versão                                                |
| ---------- | ----------------------------------------------------- |
| Node.js    | 24 (`.nvmrc`); o mínimo aceito é 20.9 (`engines`)     |
| npm        | o que vem com o Node                                  |
| API        | `superbenfica-api` rodando em `http://127.0.0.1:8000` |
| Redis      | o da API (necessário para o tempo real)               |

### Primeira vez

```bash
npm install                      # também instala os hooks do Husky
cp .env.example .env.local       # Windows: copy .env.example .env.local
npm run dev                      # http://localhost:3000
```

Use os usuários criados pela carga inicial da API (`python manage.py carga_inicial`). Por exemplo, `gerente.centro@superbenfica.com.br`, com a senha definida em `SEED_DEFAULT_PASSWORD` no `.env` da API.

### Variáveis de ambiente

Validadas com Zod em `src/config/env.ts`. Se faltar uma variável ou ela estiver inválida, a aplicação não sobe e a mensagem diz qual é.

| Variável              | Lida por            | Quando é lida         | Exemplo (dev)           |
| --------------------- | ------------------- | --------------------- | ----------------------- |
| `API_URL`             | servidor Next (BFF) | em tempo de execução  | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_WS_URL`  | navegador           | **embutida no build** | `ws://127.0.0.1:8000`   |
| `NEXT_PUBLIC_APP_ENV` | ambos               | **embutida no build** | `development`           |

- `NEXT_PUBLIC_APP_ENV` aceita `development`, `staging` ou `production` e controla os cookies `Secure`, o HSTS e algumas diretivas da CSP.
- Nenhum arquivo de código tem URL ou IP da API. Para apontar para outro ambiente, mude só as variáveis.

### Scripts

| Comando                            | O que faz                                               |
| ---------------------------------- | ------------------------------------------------------- |
| `npm run dev`                      | servidor de desenvolvimento (Turbopack)                 |
| `npm run build`                    | build de produção (`standalone`)                        |
| `npm start`                        | serve o build                                           |
| `npm run typecheck`                | `tsc --noEmit`                                          |
| `npm run lint` / `lint:fix`        | ESLint (com SonarJS e jsx-a11y)                         |
| `npm run format` / `format:check`  | Prettier (com ordenação de classes Tailwind)            |
| `npm test` / `test:watch`          | testes de unidade (Vitest)                              |
| `npm run test:coverage`            | unidade com cobertura (`coverage/lcov.info`)            |
| `npm run test:e2e` / `test:e2e:ui` | E2E com Playwright contra a API real                    |
| `npm run check`                    | typecheck + lint + testes com cobertura                 |
| `npm run sonar`                    | envia a análise ao SonarQube (precisa de `SONAR_TOKEN`) |

### Hooks de Git

O Husky roda no **pre-commit**:

1. `lint-staged`: ESLint `--fix` e Prettier nos arquivos alterados;
2. `npm run typecheck`;
3. `npm test`.

### Editor

`.vscode/extensions.json` recomenda as extensões do projeto. `.editorconfig` e `.prettierrc.json` definem a formatação.

## Convenções de código

### Regras de qualidade (SonarQube)

O ESLint segue o perfil "Sonar way" (`eslint.config.mjs`). As regras que mais aparecem no dia a dia:

- **Complexidade cognitiva** de no máximo 15 por função. Extraia funções auxiliares quando passar.
- **Nada de URL ou IP fixo no código** (S1313): use `src/config/env.ts` e `src/config/endpoints.ts`.
- **Nada de regex com backtracking excessivo** (S5852): prefira laços simples (veja `trimTrailingSlash`).
- **Tipagem:**
  - sem `any`, sem `!` (non-null assertion);
  - `import type` para tipos;
  - `===` sempre.
- **Componentes:**
  - props com `Readonly<...>`;
  - sem índice de array como `key`;
  - sem `dangerouslySetInnerHTML`.
- **`console`:** só `console.warn` e `console.error`.
- **React:**
  - não chame `setState` dentro de `useEffect` para "sincronizar" estado. Prefira recriar o componente com `key` ou resetar no evento que abriu ou fechou a tela;
  - não leia `ref.current` durante o render.

### Nomes e idioma

- **Código de domínio em português**, como na API (`pedido`, `separacao`, `formaPagamento`, `salvarProduto`).
- **Código de infraestrutura em inglês** (`createResource`, `useResourceList`, `handleUnauthorized`).
- Comentários e textos de interface em português.
- Campos que vêm da API mantêm o nome do serializer (`forma_pagamento`, `codigo_barras`).

### Organização de uma feature

```
src/features/<modulo>/
  components/<modulo>-view.tsx         tela principal (lista)
  components/<entidade>-form-dialog.tsx formulário em diálogo
  schemas.ts                            validação Zod
  <regra>.ts                            regras puras (testadas por unidade)
```

A rota em `src/app/(painel)/<rota>/page.tsx` só define o título e renderiza a tela da feature.

### Formulários

- **Validação:** React Hook Form + `zodResolver(schema)`. Use `z.input<>` para os valores do formulário e `z.output<>` para o que vai à API (`useForm<Input, unknown, Output>`).
- **Mensagens de erro:** são **chaves** do namespace `validation` do `pt-BR.json` (ex.: `{ error: "required" }`). O `FormField` traduz a chave e, se não for chave, mostra o texto como veio (erros da API).
- **Acessibilidade:** `FormField` liga o rótulo, o campo e a mensagem com `id`, `aria-invalid` e `aria-describedby`. Use-o em todo campo.
- **Selects com opções da API** devem ser **controlados** (`Controller`). Use `LojaField` para filiais e siga o mesmo padrão para outras listas (ex.: `FormaPagamentoField`).
- **Listas grandes com busca** (clientes, produtos): use `RemoteCombobox`, que busca na API (`?search=`) dentro da lista. Para listas fixas com busca (ex.: UF), use `Combobox`.
- **Telefone:** `PhoneInput` e `telefoneSchema` (`src/lib/telefone.ts`).
- **Ao abrir o diálogo**, resete o formulário com os valores do registro (`reset(toFormValues(registro))`).

### Textos e i18n

- Todo texto da interface fica em `src/messages/pt-BR.json`. As chaves são tipadas (`src/types/next-intl.d.ts`): `t("chave.inexistente")` não compila.
- Em Client Components use `useTranslations("namespace")`; em Server Components, `getTranslations`.
- Fuso horário: `America/Sao_Paulo`. Use as funções de `src/lib/format.ts` (moeda, número, data) em vez de formatar à mão.
- Para outro idioma: crie `src/messages/<locale>.json` e escolha o locale em `src/i18n/request.ts`.

### Componentes de interface

- `src/components/ui/` tem os primitivos no padrão shadcn/ui (Radix + Tailwind). Prefira compor com eles a criar estilos novos.
- **Cores** vêm de tokens CSS em `src/app/globals.css` (`bg-primary`, `text-muted-foreground`, `text-success`...). Não use cores fixas do Tailwind (`text-green-600`), que quebram o tema escuro.
- **Componentes compartilhados úteis:**
  - `DataTable`: colunas, carregamento, erro, vazio e paginação;
  - `PageHeader`;
  - `ConfirmDialog`;
  - `EmptyState` e `ErrorState`;
  - `ActiveBadge` e os badges de status;
  - `SearchInput`, com debounce.

## Receitas

### Nova tela de cadastro (CRUD)

Exemplo real: `src/features/pagamentos`.

1. **Endpoint:** adicione o caminho em `ENDPOINTS` (`src/config/endpoints.ts`).
2. **Tipos:** adicione a entidade e o tipo de entrada em `src/types/api.ts`, espelhando o serializer da API.
3. **Serviço:** `export const xApi = createResource<X, XInput>(ENDPOINTS.x)` em `src/services/api.ts`.
4. **Schema:** `src/features/<modulo>/schemas.ts` com Zod, usando as chaves de erro de `validation`.
5. **Telas:** `<modulo>-view.tsx` (lista com `useResourceList` + `DataTable`) e `<entidade>-form-dialog.tsx` (com `useSaveResource` + `applyFieldErrors`).
6. **Rota:** `src/app/(painel)/<rota>/page.tsx` com `generateMetadata` e a tela.
7. **Permissões:** chaves em `PERMISSIONS`, prefixo em `ROUTE_PERMISSIONS` e item em `NAV_ITEMS` (veja [Perfis e permissões](permissoes.md)).
8. **Textos:** namespace novo em `pt-BR.json` e o rótulo em `nav`.
9. **Testes:** schema e permissões em `tests/unit`, fluxo principal em `tests/e2e` (com as gravações interceptadas).

### Nova ação em um recurso existente

1. Adicione o caminho em `ENDPOINTS` (ex.: `pedidoFinalizar: (id) => \`pedidos/${id}/finalizar\``).
2. Adicione o método no serviço (`src/services/api.ts`).
3. Na tela, use `useApiMutation({ mutationFn, invalidate: [dominios] })`.

### Novo campo vindo da API

1. Atualize o tipo em `src/types/api.ts`.
2. Se o campo for editável, inclua-o no schema Zod, nos valores iniciais do formulário (`toFormValues`) e no formulário.
3. Se ele entrar em listas, inclua a coluna no `DataTable`.
4. Atualize os mocks dos testes E2E que montam esse objeto.

### Novo evento de tempo real

Veja [Tempo real](tempo-real.md#como-adicionar-um-evento).

## Next.js 16

Esta versão tem mudanças em relação ao que costuma aparecer em exemplos e tutoriais:

- `src/proxy.ts` substitui o `middleware.ts`, e a função exportada se chama `proxy`.
- `cookies()`, `headers()`, `params` e `searchParams` são **assíncronos** (`await`).
- `next dev` usa Turbopack e grava em `.next/dev`. O `next build` grava em `.next`, então os dois podem rodar ao mesmo tempo.
- O `next dev` reescreve um bloco do `AGENTS.md`. Esse bloco é esperado, e não há problema em versioná-lo.

Na dúvida, leia o guia em `node_modules/next/dist/docs/` antes de escrever código do Next.
