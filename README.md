# Prospero — Frontend

App principal de **Prospero** (finanzas personales / control de presupuesto). Next.js (Pages
Router) + Chakra UI, autenticación vía NextAuth contra `prospero-backend`.

![Github Actions](https://github.com/Prospero-Inc/prospero-front/actions/workflows/nextjs.deployment.yml/badge.svg)

## Requisitos

- Node.js 18–22
- pnpm >= 9.4.0 (**no uses pnpm 10+**: bloquea scripts de build por defecto y rompe la
  instalación de este proyecto)
- `prospero-backend` corriendo (ver ese repo, o levantar todo junto con Docker Compose más abajo)

## Levantar en local (pnpm)

```bash
pnpm install
cp .env.example .env.local   # completar los valores (ver notas abajo)
pnpm dev                      # http://localhost:3000
```

### Variables de entorno

Ver `.env.example`. La que más confunde: `NEXTAUTH_URL_INTERNAL` — solo hace falta si el puerto
público de la app (el que ve el navegador) es distinto del puerto en el que realmente escucha
Next.js (típicamente al correr detrás de Docker con mapeo de puertos). Sin eso, cualquier página
que dependa de `getServerSideProps` para leer la sesión (dashboard, entries, expenditures,
settings, profile) no va a ver al usuario logueado del lado servidor.

## Levantar todo el stack con Docker (recomendado para probar de punta a punta)

Este repo es parte de un workspace con `prospero-backend` y `prosper-change-password`. Si los
tenés clonados como hermanos en el mismo directorio, un solo comando levanta Postgres, una
bandeja de correo falsa (Mailpit) y las tres apps, ya con los env vars correctos:

```bash
cd .. # a la carpeta que contiene los tres repos
docker compose up --build
```

Ver `docker-compose.yml` y `docs/testing-guide.md` en la raíz del workspace para el detalle
completo (URLs, credenciales de la DB, qué probar paso a paso).

## Comandos

```bash
pnpm build       # build de producción
pnpm start       # correr el build
pnpm lint        # eslint
pnpm lint:fix    # eslint --fix + prettier
pnpm format      # prettier --check
```

No hay test runner configurado en este repo todavía.

## Más detalle de arquitectura

Ver `CLAUDE.md` en este repo (patrón de proxy a la API, flujo de login/2FA, estructura de
páginas y servicios).
