
FROM node:18-alpine AS base

ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

RUN apk add --no-cache g++ make py3-pip libc6-compat
WORKDIR /usr/src/app
COPY package*.json ./
EXPOSE 3000


FROM base AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build

FROM base AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production
RUN npm install -g pnpm
RUN pnpm install --prod --ignore-scripts --prefer-frozen-lockfile

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs


ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/public ./public

CMD pnpm start
