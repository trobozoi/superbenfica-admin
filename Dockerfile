# syntax=docker/dockerfile:1
# Imagem multi-stage do painel. Alvos:
#   dev    -> desenvolvimento com hot reload (usado pelo docker-compose.yml)
#   runner -> produção (saída "standalone" do Next, usuário sem privilégios)

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- dependências ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---------- desenvolvimento ----------
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# ---------- build de produção ----------
FROM deps AS builder
# Variáveis NEXT_PUBLIC_* são embutidas no bundle durante o build.
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL} \
    NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
COPY . .
RUN npm run build

# ---------- produção ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# API_URL (servidor) é lida em tempo de execução: docker run -e API_URL=https://...
CMD ["node", "server.js"]
