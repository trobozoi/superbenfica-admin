# Deploy

O painel é publicado como uma imagem Docker com a saída `standalone` do Next. Ela tem só o necessário para rodar, sem `node_modules` completos.

## Variáveis de produção

| Variável              | Valor de exemplo                | Quando definir                                        |
| --------------------- | ------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_WS_URL`  | `wss://api.seudominio.com.br`   | **no build** (`--build-arg`); fica embutida no bundle |
| `NEXT_PUBLIC_APP_ENV` | `production`                    | **no build** (padrão `production` no Dockerfile)      |
| `API_URL`             | `https://api.seudominio.com.br` | **na execução** (`-e API_URL=...`)                    |

Se `NEXT_PUBLIC_WS_URL` mudar, gere a imagem de novo. Já `API_URL` pode mudar só reiniciando o container.

Com `NEXT_PUBLIC_APP_ENV=production`, o painel liga:

- cookies `Secure` (exige HTTPS);
- HSTS (`Strict-Transport-Security`, 2 anos, `preload`);
- `upgrade-insecure-requests` na CSP;
- e remove o `'unsafe-eval'` e o `ws:` que a CSP aceita em desenvolvimento.

## Imagem de produção

O `Dockerfile` é multi-stage:

| Alvo      | Uso                                                                   |
| --------- | --------------------------------------------------------------------- |
| `deps`    | `npm ci` (base dos demais)                                            |
| `dev`     | desenvolvimento com hot reload (usado pelo `docker-compose.yml`)      |
| `builder` | `npm run build` com as variáveis `NEXT_PUBLIC_*`                      |
| `runner`  | produção: Node 24 Alpine, usuário sem privilégios `nextjs` (uid 1001) |

```bash
docker build --target runner \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.seudominio.com.br \
  -t superbenfica-admin .

docker run -d -p 3000:3000 \
  -e API_URL=https://api.seudominio.com.br \
  --name superbenfica-admin superbenfica-admin
```

O container escuta na porta 3000 (`HOSTNAME=0.0.0.0`). Coloque um proxy reverso com HTTPS na frente (Nginx, Caddy ou o balanceador da nuvem).

## Desenvolvimento com Docker

```bash
docker compose up --build        # http://localhost:3000
```

- A API continua fora do container (`python manage.py runserver`).
- O servidor Next, dentro do container, acessa a API por `http://host.docker.internal:8000`. Para mudar, use `DOCKER_API_URL`.
- O navegador acessa o WebSocket direto no host (`ws://127.0.0.1:8000`). Para mudar, use `NEXT_PUBLIC_WS_URL`.
- O código é montado como volume, com `WATCHPACK_POLLING=true` para o hot reload funcionar no Windows e no macOS.

## Requisitos na API de produção

O painel depende de configurações do backend:

- **CORS e CSRF:** inclua o domínio do painel em `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`.
- **WebSocket:** o `Origin` do painel precisa passar no `AllowedHostsOriginValidator` da API (`DJANGO_ALLOWED_HOSTS`), e a API precisa estar atrás de um proxy que encaminhe `Upgrade` em `/ws/`.
- **Redis:** obrigatório em produção (channel layer, cache e rate limit compartilhados). O `CHANNEL_LAYER_SOCKET_TIMEOUT` (padrão 15 s) precisa ser maior que 5 s.
- **Fotos:** a API serve `/media/` (Nginx no Docker da API). O painel busca essas fotos pelo servidor (`/api/media`), então `API_URL` precisa alcançar `/media/`.
- **Limite de upload:** o Nginx da API aceita até 5 MB; o BFF também barra acima disso.

## Checklist de publicação

- [ ] `npm run check` e `npm run build` sem erros.
- [ ] Testes E2E rodados localmente contra uma API equivalente à de produção.
- [ ] Quality Gate do SonarQube aprovado.
- [ ] Imagem gerada com `NEXT_PUBLIC_WS_URL=wss://...` e `NEXT_PUBLIC_APP_ENV=production`.
- [ ] `API_URL` com `https://`.
- [ ] Domínio do painel liberado no CORS, CSRF e `ALLOWED_HOSTS` da API.
- [ ] HTTPS ativo no proxy reverso (os cookies `Secure` não funcionam sem ele).
- [ ] Depois de publicar: login, uma tela de cada perfil e o indicador "Tempo real ativo" (exige uma filial selecionada, no caso do ADMIN).

## Atualizar a versão

O projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/): `MAIOR.MENOR.CORREÇÃO`.

1. `npm version <nova> --no-git-tag-version`, que atualiza o `package.json` e o `package-lock.json`.
2. Atualize `sonar.projectVersion` em `sonar-project.properties`.
3. Registre as mudanças no [CHANGELOG.md](../CHANGELOG.md).
4. Commite e crie a tag: `git tag -a v<nova> -m "v<nova>"`.
5. Envie o commit e a tag: `git push origin main --follow-tags`.
