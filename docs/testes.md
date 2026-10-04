# Testes

| Tipo    | Ferramenta               | Pasta        | Comando            | Precisa da API? |
| ------- | ------------------------ | ------------ | ------------------ | --------------- |
| Unidade | Vitest + Testing Library | `tests/unit` | `npm test`         | não             |
| E2E     | Playwright (Chromium)    | `tests/e2e`  | `npm run test:e2e` | **sim (real)**  |

## Testes de unidade

- **Ambiente:** `jsdom`, com `globals` ativos. O `tests/setup.ts` define as variáveis `NEXT_PUBLIC_*` (validadas no import) e limpa o DOM após cada teste.
- **Helpers** (`tests/helpers.tsx`): `renderWithIntl(ui)` renderiza com as traduções pt-BR, e `makeToken({ role, expiresIn, ... })` gera um JWT no formato da API.
- **O que testar:** a lógica fora dos componentes. Isso inclui config, `lib`, `services`, `store`, os schemas Zod e as regras das features (`actions`, `checklist`, `csv`, `estoque`, `foto`, `summary`, `service`).
- **Cobertura** (`npm run test:coverage`): o escopo é o mesmo do Sonar (`vitest.config.mts`), com mínimos de **80% de linhas, funções e statements e 75% de branches**. O relatório fica em `coverage/` (`lcov.info` para o Sonar e `index.html` para leitura).
- Páginas, layouts e componentes visuais ficam fora da cobertura de unidade e são validados pelo E2E.

### Dicas

- **JWT nos testes:** use `makeToken`. Ele gera tokens com assinatura fictícia: o `SignJWT` do `jose` não funciona no jsdom, e o painel só decodifica o token (`decodeJwt`). Quem verifica a assinatura é a API.
- **Requisições HTTP:** use o adaptador do axios ou `vi.spyOn` no serviço; não chame a rede.
- **APIs do navegador ausentes no jsdom** (ex.: `PasswordCredential`, `navigator.credentials`): crie-as com `vi.stubGlobal` e `Object.defineProperty`, e limpe no `afterEach` (veja `tests/unit/features/lembrar-login.test.ts`).

## Testes E2E

Rodam contra a **API real**: o login, as listas e as permissões usam o backend de verdade.

### Preparação

1. Suba a API e o Redis. Confira se `http://127.0.0.1:8000/api/schema/` responde 200.
2. Crie `.env.test.local` (não versionado) a partir de `.env.test.example`:
   ```
   E2E_ADMIN_EMAIL=<DJANGO_SUPERUSER_EMAIL da API>
   E2E_ADMIN_PASSWORD=<DJANGO_SUPERUSER_PASSWORD da API>
   E2E_SEED_PASSWORD=<SEED_DEFAULT_PASSWORD da API>
   ```
3. Instale o navegador uma vez: `npx playwright install chromium`.
4. Rode `npm run test:e2e`, ou `npm run test:e2e:ui` para o modo interativo.

O Playwright sobe o `npm run dev` sozinho. Se já houver um servidor na porta 3000, ele é reaproveitado (`reuseExistingServer`). A porta pode ser trocada com `E2E_PORT`.

O `globalSetup` (`tests/e2e/global-setup.ts`) confere a API e as credenciais antes de começar e falha com uma mensagem clara se faltar algo.

### Limite de login da API

A API aceita **5 logins por minuto** por padrão (`THROTTLE_LOGIN`), e a suíte completa faz cerca de 30. Rodar tudo de uma vez faz vários testes falharem com "Muitas tentativas" (429), presos em `/login`. Há duas saídas:

- **Recomendado para desenvolvimento local:** no `.env` da API, defina `THROTTLE_LOGIN=100/min` e reinicie a API. Não use esse valor em produção.
- **Rodar em lotes** de até 5 logins, com 1 minuto entre eles:
  ```bash
  npx playwright test tests/e2e/roles.spec.ts
  npx playwright test tests/e2e/auth.spec.ts -g "logout|CLIENTE"
  ```

### Regras para escrever testes E2E

- **Não grave no banco real.** Intercepte as gravações com `page.route` e responda com um mock (veja `captureSaves` em `produtos.spec.ts` e as gravações em `pagamentos.spec.ts`). Valide o **payload** enviado.
- **Telas com estado complexo** (ex.: separação) podem simular a API inteira com `page.route`, mantendo o estado no próprio mock (`separacao.spec.ts`).
- **Exceção, só quando a integração for o objetivo do teste:** o envio real de foto (`produtos.spec.ts`). Nesse caso, use um registro que não afete dados reais (produto sem foto) e restaure o estado num `finally`.
- **Seletores:** use papéis e rótulos acessíveis (`getByRole`, `getByLabel`), do jeito que o usuário vê. Isso também testa a acessibilidade. Para rótulos que contêm outros, use `{ exact: true }` (ex.: "Senha" e "Salvar senha neste navegador").
- **Dados da carga inicial:** não dependa do nome exato quando ele pode mudar. Prefira regex parcial (ex.: `/Leite integral UHT/`).
- **Login:** use `loginAndWait(page, credentials.admin())` ou `credentials.seed(SEED_USERS.gerente)` (`tests/e2e/fixtures.ts` e `credentials.ts`).

### O que a suíte cobre

| Arquivo              | Cobertura                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `auth.spec.ts`       | redirecionamento sem sessão, login inválido, validação, cookies httpOnly, salvar senha, refresh, CSRF, logout, CLIENTE barrado |
| `roles.spec.ts`      | visões e bloqueios por perfil, filial preenchida para o GERENTE, lista de produtos da API                                      |
| `produtos.spec.ts`   | estoque inicial e mínimo por filial, validação, código de barras, edição, envio e remoção de foto                              |
| `clientes.spec.ts`   | endereço pelo ViaCEP, busca de UF, máscara de telefone, CEP inexistente, endereço incompleto                                   |
| `pedidos.spec.ts`    | busca de cliente e produto dentro da lista, forma de pagamento obrigatória, payload do pedido                                  |
| `separacao.spec.ts`  | checklist por caixa e por leitor, bloqueio da conclusão, separador sem permissão                                               |
| `pagamentos.spec.ts` | cadastro, edição e desativação (ADMIN), só consulta (GERENTE), sem acesso (CAIXA)                                              |

### Quando um teste falha

- O relatório HTML fica em `playwright-report/` (`npx playwright show-report`).
- Traces e screenshots das falhas ficam em `test-results/` (`npx playwright show-trace <arquivo>.zip`).
- `error-context.md`, dentro da pasta de cada falha, traz o erro, a árvore de acessibilidade da página e o trecho do teste.

## Integração contínua

O `.github/workflows/ci.yml` roda, a cada push na `main` e em cada pull request:

1. typecheck;
2. lint;
3. formatação;
4. testes de unidade com cobertura;
5. build;
6. análise do SonarQube Cloud e Quality Gate (secret `SONAR_TOKEN`).

Os testes E2E **não** rodam no CI, porque dependem da API real. Rode-os localmente antes de abrir um PR que mexa em telas.
