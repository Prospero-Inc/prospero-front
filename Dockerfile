
FROM node:18-alpine AS base

ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AUTH_SECRET

RUN apk add --no-cache g++ make py3-pip libc6-compat
WORKDIR /usr/src/app
# pnpm 10+ blocks postinstall build scripts by default and breaks the
# install (core-js/sharp) — pin to the major that already works, same
# fix Dockerfile.dev has. Installed once here so both stages below (which
# both `FROM base`) already have it, instead of reinstalling it twice.
RUN npm install -g pnpm@9
EXPOSE 3000


FROM base AS builder
WORKDIR /usr/src/app
# Deps copied and installed BEFORE the rest of the source, so Docker only
# re-runs `pnpm install` when package.json/pnpm-lock.yaml actually change
# — a source-only change (the common case) reuses this cached layer
# instead of reinstalling everything on every deploy.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM base AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs


ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AUTH_SECRET=$AUTH_SECRET

# node_modules comes straight from the builder (already has everything
# `pnpm build` needed) — no second install here, it would just get
# overwritten by this COPY anyway.
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/public ./public

CMD pnpm start
