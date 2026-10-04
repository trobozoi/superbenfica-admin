# Solução de problemas

## Ambiente

### `node` (ou `npm`) não é reconhecido

O Node foi instalado, mas o terminal ainda usa o `PATH` antigo.

- Feche e abra o VS Code (ou o terminal).
- Ou recarregue o `PATH` no PowerShell atual:
  ```powershell
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  ```
- No Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.

### "Variáveis de ambiente inválidas ou ausentes"

Falta o `.env.local`, ou uma URL está em formato errado. Copie o `.env.example` e confira:

- `API_URL` com `http(s)://`;
- `NEXT_PUBLIC_WS_URL` com `ws(s)://`.

### Mudei `NEXT_PUBLIC_WS_URL` e nada mudou

Variáveis `NEXT_PUBLIC_*` são embutidas no build. Em desenvolvimento, reinicie o `npm run dev`. Em produção, gere a imagem de novo.

### A porta 3000 está ocupada

Outro `next dev` (ou um servidor esquecido) está rodando. Para ver qual processo é, no PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
```

Encerre-o com `Stop-Process -Id <PID>`, ou use outra porta (`npm run dev -- -p 3001`).

## Login e sessão

### "Não foi possível falar com a API"

A API está fora do ar ou em outro endereço. Confira se `API_URL` responde (`<API_URL>/api/schema/` deve dar 200) e se o `runserver` está rodando.

### "Muitas tentativas. Aguarde um minuto"

A API limita o login a **5 por minuto** (`THROTTLE_LOGIN`). Espere um minuto. Em desenvolvimento, você pode aumentar o limite no `.env` da API (ex.: `THROTTLE_LOGIN=100/min`).

### "Seu perfil não tem acesso ao painel"

O usuário é `CLIENTE`. Só funcionários (ADMIN, GERENTE, SEPARADOR, CAIXA) entram no painel.

### A sessão expira sozinha

O access token dura 15 minutos e é renovado automaticamente. Se a renovação falhar, o painel volta para o login com "Sua sessão expirou". Isso acontece quando:

- o refresh expirou;
- o refresh foi revogado (logout em outra aba);
- a API foi reiniciada com outra `SECRET_KEY`.

## Tempo real

### `GET /api/auth/ws-token` a cada ~10 segundos

O WebSocket está caindo e reconectando em loop, e cada reconexão pede um token novo. Para investigar:

1. Abra o DevTools → Network → WS e veja o código de fechamento.
2. Se for **1011** (erro interno da API) poucos segundos depois de abrir, a causa conhecida é o Redis: o `redis-py` 8 desiste da leitura em 5 s, exatamente o tempo em que o `channels_redis` espera mensagens. A API já corrige isso com `CHANNEL_LAYER_SOCKET_TIMEOUT` (padrão 15 s). Confira se a API está atualizada e se esse valor é maior que 5.
3. Se o handshake for recusado com **403** antes de abrir, o `Origin` do painel não está em `DJANGO_ALLOWED_HOSTS` da API, ou o token é inválido. A API fecha antes de aceitar, e o navegador mostra 1006.

### "Tempo real inativo" para o ADMIN

É esperado: o ADMIN precisa escolher uma filial no topo. Não existe canal de "todas as filiais".

### Os dados não se atualizam sozinhos

- Confira se o indicador está "Tempo real ativo".
- Confira se o Redis da API está no ar. Sem Redis, eventos publicados por outro processo (ex.: Celery) não chegam.

## Desenvolvimento

### O terminal do `next dev` mostra muitos "Console Ninja failed to send logs"

Esses erros vêm da extensão Console Ninja do VS Code, não do painel: ela abre um WebSocket local que a CSP bloqueava. Em desenvolvimento, a CSP aceita `ws:` (`src/proxy.ts`) justamente para isso. Se as mensagens aparecerem, confira se `NEXT_PUBLIC_APP_ENV` não está como `production` no `.env.local`, ou desative a extensão neste projeto.

### Um select abre vazio ou perde o valor

Selects com opções vindas da API precisam ser **controlados**. Com `register`, o valor chega antes das opções e o navegador o descarta. Use `LojaField` ou o mesmo padrão com `Controller` (veja [Desenvolvimento](desenvolvimento.md#formulários)).

### `t("...")` não compila

A chave não existe no `src/messages/pt-BR.json`. As chaves são tipadas: adicione o texto no JSON.

### O lint acusa `sonarjs/cognitive-complexity`

A função passou de 15 de complexidade cognitiva. Extraia partes para funções auxiliares ou para um arquivo de regras da feature.

### O `next dev` alterou o `AGENTS.md`

O próprio Next reescreve um bloco desse arquivo. Isso é esperado; versione a mudança junto com o seu trabalho.

## Testes

### Vários E2E falham presos em `/login`

É o limite de login da API (5 por minuto). Veja [Testes](testes.md#limite-de-login-da-api).

### O E2E falha antes de começar com "A API não respondeu"

O `globalSetup` não alcançou `API_URL/api/schema/`. Suba a API, ou confira o `API_URL` no `.env.local`.

### "Defina E2E_... em .env.test.local"

Crie o `.env.test.local` a partir do `.env.test.example` com os valores da carga inicial da API.

### `browserType.launch: Executable doesn't exist`

Instale o navegador do Playwright: `npx playwright install chromium`.

### Um teste procura um produto ou cliente que não existe

A carga inicial da API mudou. Prefira regex parcial nos seletores, ou rode `python manage.py carga_inicial` na API para recriar os dados de exemplo.

### Duas execuções do Playwright ao mesmo tempo falham com `ENOENT` em `test-results`

As duas usam a mesma pasta de resultados e apagam os arquivos uma da outra. Rode uma de cada vez.
