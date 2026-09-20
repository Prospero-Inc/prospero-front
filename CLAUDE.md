# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`, `engines.pnpm` in `package.json`).

```bash
pnpm install
pnpm dev            # next dev, http://localhost:3000
pnpm build          # next build
pnpm start          # next start

pnpm lint           # eslint on src/.vscode/test
pnpm lint:fix       # eslint --fix + prettier write
pnpm format         # prettier --check src/**/*.{ts,tsx}
pnpm format:fix     # prettier --write
```

No test runner is configured in this repo. Husky + lint-staged + commitlint run on
commit/commit-msg (`.husky/`, `.commitlintrc`) — commits must follow Conventional Commits.

## Architecture

Next.js **Pages Router** (not App Router) frontend for **Prospero**, a personal-finance /
budgeting app that talks to `prospero-backend`. Chakra UI + Emotion for styling/theming
(`src/themes`), `next-i18next` for i18n (`public/locales`, `next-i18next.config.js`).

### Auth

NextAuth (`src/pages/api/auth/[...nextauth].ts`, config in `src/config/authConfig.ts`) backed by
the NestJS API's JWT — session token is a NextAuth JWT, not a raw backend token. `src/middleware.ts`
gates all non-API/non-static routes: redirects `/` → `/dashboard`, sends unauthenticated users to
`/auth/login`, and redirects already-authenticated users away from
`/auth/{login,register,forgot-password,verify-2fa}`. It also hand-rolls CORS preflight handling
for a hardcoded `allowedOrigins` list — update that list if a new client origin needs access.

Login is two-step when the account has 2FA enabled: `LoginView` first calls
`POST /proxy/login`; a plain success returns `{ accessToken, user }` and is handed straight to
`signIn('credentials', { accessToken, user: JSON.stringify(user), ... })` (the
`CredentialsProvider.authorize` in `authConfig.ts` short-circuits to that pair instead of calling
the backend again when it sees them). A `{ requires2FA, preAuthToken }` response instead stashes
`preAuthToken` in `sessionStorage` (`PRE_AUTH_TOKEN_STORAGE_KEY` in `src/interfaces/auth.interface.ts`)
and routes to `/auth/verify-2fa` (`VerifyTwoFactorView`), which exchanges the OTP + preAuthToken
via `POST /proxy/login-verify-2fa` for the real `{ accessToken, user }` before calling `signIn`
the same way. Don't confuse this with `/profile/verify-2fa` — that page verifies a code when
*enabling* 2FA from an already-authenticated session; it's unrelated to the login gate.

### API proxy pattern

There are two ways a page reaches `prospero-backend`, and which one to use depends on where the
call happens:

- **Client-side / interactive actions** (form submits, button clicks) go through Next.js API
  routes under `src/pages/api/proxy/*` (e.g. `create-transaction.ts`, `update-transaction.ts`,
  `create-salary.ts`, `login.ts`), each a thin `createHandler(HttpMethod.X, serviceFn)`
  (`src/lib/createHandler`) wrapping a function from `src/services/*` that calls the backend with
  `externalApiService` (`NEXT_PUBLIC_API_URL`). `createHandler` binds exactly one HTTP method per
  file and merges the Next.js route's own query string into the params the service function
  receives — that's how e.g. `update-transaction.ts`/`delete-transaction.ts` get an `id` (called
  as `/proxy/update-transaction?id=123`) without a dynamic route file. Add new backend
  integrations by adding a service function plus a matching proxy route, following this pattern.
- **`getServerSideProps`** (page-load data fetching) calls the same `src/services/*` functions
  **directly**, no proxy hop needed since it already runs on the server — see
  `requestProfile`/`getSalaryDetails`/`getTransactions` used this way in `profile/index.tsx`,
  `dashboard.tsx`, `entries.tsx`, `expenditures.tsx`, `settings.tsx`. After a client-side
  create/update/delete, these pages call `router.replace(router.asPath)` to force
  `getServerSideProps` to refetch rather than keeping separate client-side cache state.

### Structure

- `src/pages/` — routed pages: `auth/*` (login/register/forgot-password/verify-2fa),
  `dashboard`, `entries` (income), `expenditures` (transactions), `goals` (placeholder — the
  spec marks detailed savings goals as post-MVP), `settings`, `budget-calculator`, `profile/*`
  (incl. 2FA setup/verify flows). All except `goals` and the `auth/*` pages use
  `getServerSideProps` (needed for the auth token + per-user data).
- `src/components/views/` — page-level feature components (`auth`, `budgetCalculator`,
  `profile`), separate from `components/ui` (design-system primitives) and `components/layouts`.
- `src/services/` — backend-calling functions, either wrapped by a proxy route or called
  directly from `getServerSideProps`: `2fa.ts`, `budgetCalculator.ts`, `userService.ts`,
  `request-profile.ts`, `login.ts`, `salary.ts`, `transactions.ts`.
- `src/hooks`, `src/interfaces`, `src/types`, `src/enums` — shared frontend-only types/enums
  (e.g. `HttpMethod`) and hooks.

### Related repo

Password-reset emails sent by the backend link to the separate `prosper-change-password` app
(a standalone Vite SPA), not a page in this Next.js app.
