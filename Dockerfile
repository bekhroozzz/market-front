# syntax=docker/dockerfile:1

FROM node:22-alpine AS dependencies

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    PM2_HOME=/tmp/.pm2

# PM2 runs the SSR server as a cluster to use all cores. The Nitro output is
# self-contained, so pm2 is installed globally rather than via node_modules.
RUN npm install -g pm2@latest \
    && addgroup -S nuxt && adduser -S nuxt -G nuxt

COPY --from=build --chown=nuxt:nuxt /app/.output ./.output
COPY --chown=nuxt:nuxt ecosystem.config.cjs ./ecosystem.config.cjs

USER nuxt

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" > /dev/null || exit 1

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
