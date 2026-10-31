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
pnpm build && pnpm test:e2e   # Playwright mobile smoke tests (iPhone + Pixel viewports)
```

The only tests are Playwright's (`e2e/`, `playwright.config.ts`): they run the production build
(`next start`) against `e2e/fake-backend.mjs`, a tiny stand-in API (login, profile, create
transaction; everything else 404, which pages already treat as "no data"). `smoke.spec.ts` is
the safety net for upgrades (login, add an expense); `mobile-basics.spec.ts` pins the mobile
rules (16 px gutter, ≥16 px fields, ≥44 px buttons, autofill/keyboard attributes, `lang`,
manifest). CI runs them on every PR. Locally Chromium needs system libraries; if they're
missing, run them in `mcr.microsoft.com/playwright:<version>-noble` with `--network host`.
Husky + lint-staged + commitlint run on commit/commit-msg (`.husky/`, `.commitlintrc`) —
commits must follow Conventional Commits.

## Architecture

Next.js 15 **Pages Router** (not App Router, React 18, Node 22) frontend for **Prospero**, a personal-finance /
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
`POST /proxy/login`; a plain success returns `{ accessToken, accessTokenExpiresIn, refreshToken,
user }` and is handed straight to `signIn('credentials', { accessToken, refreshToken,
accessTokenExpiresIn, ... })`. `CredentialsProvider.authorize` in `authConfig.ts` never trusts
that posted token (the NextAuth callback is public): it resolves the user from `GET /auth/profile`
with it and rejects the sign-in if the backend does. A `{ requires2FA, preAuthToken }` response instead stashes `preAuthToken` in
`sessionStorage` (`PRE_AUTH_TOKEN_STORAGE_KEY` in `src/interfaces/auth.interface.ts`) and routes to
`/auth/verify-2fa` (`VerifyTwoFactorView`), which exchanges the OTP + preAuthToken via
`POST /proxy/login-verify-2fa` for the real token set before calling `signIn` the same way. Don't
confuse this with `/profile/verify-2fa` — that page verifies a code when *enabling* 2FA from an
already-authenticated session; it's unrelated to the login gate.

#### Deploy

The image only gets non-secret build args (`NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`);
`NEXTAUTH_SECRET` reaches the container at runtime through `docker-compose.yml` (the deploy
job's env, from GitHub secrets) — middleware and NextAuth read it at runtime. The deploy job
deploys the commit-SHA image (`IMAGE_TAG`), tags the running one `:rollback` first, runs
`docker compose up -d --wait` against the `GET /api/health` healthcheck and rolls back if the
new container never turns healthy.

#### Server-side calls to the backend

Server code reaches the backend over the internal Docker network (`API_INTERNAL_URL`, set in
`docker-compose.yml`) and forwards the browser's IP as `X-Forwarded-For` so the backend's rate
limits are per user: wrap any new entry point that calls the backend — API routes go through
`createHandler`, `getServerSideProps` through `withClientIp`, anything else through
`runWithClientIp` (all in `src/lib/server/clientIp.ts`, server-only, not exported from `@/lib`).
Gmail's OAuth redirect lands on `pages/api/gmail/callback.ts`, which completes the flow with that
browser's session (`POST /gmail/oauth/complete`) so a consent link can't be completed by another
user.

#### Access + refresh token rotation

The backend issues short-lived (15m) access tokens plus a long-lived (30d), rotating, revocable
opaque `refreshToken` — see `docs/auth-refresh-tokens.md` for the full design (this is the
approved, implemented design, not just a proposal). The NextAuth JWT (`token`, encrypted/httpOnly,
never sent to the browser as-is) is the only place `refreshToken` and `accessTokenExpires` (an
epoch-ms timestamp) live; the `session` object exposed to client code via `useSession()` only ever
gets `session.accessToken` and `session.error` — **never** `session.refreshToken`. Don't
"fix" this by copying it over by analogy with `accessToken`; it's the one security-load-bearing
detail of this design.

- `authConfig.ts`'s `jwt` callback is the refresh engine (NextAuth v4's documented refresh-token
  rotation recipe): on a fresh `signIn` it seeds `token.accessToken`/`refreshToken`/
  `accessTokenExpires` from the `user` object `authorize` returned; on every subsequent call it
  either returns the token as-is (still before `accessTokenExpires`) or calls
  `refreshAccessToken(token)`, which `POST`s `/proxy/refresh-token` with the current
  `refreshToken`, rotates all three fields from the response, and — on failure (dead/revoked
  refresh token) — sets `token.error = 'RefreshAccessTokenError'` instead of throwing, so NextAuth's
  session handling doesn't crash; it just carries a session marked invalid.
- `<SessionWatcher />` (`src/components/ui/SessionWatcher.tsx`, mounted in `_app.tsx` inside
  `SessionProvider`) is a client-side effect watching `useSession()` that force-signs-out
  (`signOut({ callbackUrl: '/auth/login' })`) as soon as `session.error === 'RefreshAccessTokenError'`.
  `middleware.ts` additionally treats `token?.error` the same as "no token" (both for gating
  protected pages *and* for not redirecting an errored session away from `/auth/login`, which
  would otherwise infinite-loop against the SSR guard below), so a dead session can't get a page
  render before the watcher fires.
- `getServerSideProps` pages that need the session (`dashboard`, `entries`, `expenditures`,
  `settings`, `profile/index`) call the shared `getValidSession(req)` helper (`src/lib/session.ts`)
  instead of `next-auth/react`'s `getSession` directly — it wraps `getSession` and returns a
  ready-to-return `{ redirect: { destination: '/auth/login', ... } }` when `session.error` is set,
  so each page just does `const { session, redirect } = await getValidSession(req); if (redirect)
  return redirect`. `fixed-expenses.tsx` and `profile/2fa.tsx` still call `getSession` directly and
  haven't been migrated to this helper — same gap, lower priority since those pages weren't in
  scope for the refresh-token rollout.
- Explicit "cerrar sesión" actions (`settings.tsx`, `MobileNav.tsx`) call
  `signOutAndUnsubscribePush(session?.accessToken, opts)` (`src/lib/signOutAndUnsubscribePush.ts`),
  which best-effort unsubscribes this browser from Web Push (bounded by a timeout, errors
  swallowed) and then calls NextAuth's `signOut()` — so the next user of the same browser
  doesn't get the previous user's pushes. Use it for any new explicit logout button.
  Server-side revocation happens automatically via `authConfig.ts`'s `events.signOut`, which `POST`s `/proxy/logout` with the session's refresh token so it can't be
  replayed after the user logs out.
- The `jwt`/`logout` callbacks call this app's own `/api/proxy/refresh-token` and
  `/api/proxy/logout` routes (not the backend directly) via an absolute self-URL built from
  `NEXTAUTH_URL_INTERNAL`/`NEXTAUTH_URL` (same env vars `getSession({ req })` already relies on
  for its own self-fetch, documented in `.env.example`) — required since this code runs
  server-side with no browser `document` to resolve a relative URL against.

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
  **The client component calling the proxy must pass its own `Authorization` header explicitly**
  (`useSession()` → `Bearer ${session?.accessToken}`) — the proxy route has no session of its
  own, it only forwards whatever header the browser sent it. Forgetting this is a real bug we hit
  twice (entries/expenditures silently 401'd with no visible error until `createHandler`'s error
  handling was also fixed to stop swallowing the real status/message — see git history).
  `apiService.ts`'s `HttpError` class carries the real upstream status end-to-end through this
  chain; don't go back to throwing plain `Error`s there.
- **`getServerSideProps`** (page-load data fetching) calls the same `src/services/*` functions
  **directly**, no proxy hop needed since it already runs on the server — see
  `requestProfile`/`getSalaryDetails`/`getTransactions` used this way in `profile/index.tsx`,
  `dashboard.tsx`, `entries.tsx`, `expenditures.tsx`, `settings.tsx`. After a client-side
  create/update/delete, these pages call `router.replace(router.asPath)` to force
  `getServerSideProps` to refetch rather than keeping separate client-side cache state.

### Web Push notifications

Standard Web Push (VAPID, **not** Firebase). Pieces:

- `worker/index.js` (repo root) — custom service worker code. next-pwa 5.6 picks up
  `worker/index.{js,ts}` by default (`customWorkerDir: 'worker'`), bundles it as
  `public/worker-<buildId>.js` and adds it to the generated `public/sw.js` via
  `importScripts(...)`. Handles `push` (JSON payload `{ title, body, url, tag }`, tolerant of
  empty/malformed payloads) and `notificationclick` (focuses + navigates an existing same-origin
  tab, or opens one; non-same-origin `url`s fall back to `/dashboard`). Not linted/type-checked
  (outside `src/`).
  next-pwa compiles it with `babel-loader`, resolved from the project root — under pnpm's strict
  layout it isn't hoisted, which is why `babel-loader` is an explicit devDependency. If the build
  log says `[PWA] Failed to build custom worker`, `sw.js` ships without push handlers.
- `src/lib/webPush.ts` — browser-side logic: support/iOS/standalone detection, VAPID key
  decoding, subscribe/unsubscribe against the proxies, typed `PushSubscriptionError` codes.
- `src/hooks/usePushSubscription.ts` — React state over that lib (availability, permission,
  `isSubscribed`, `enable`/`disable`); consumed by `components/views/settings/PushDeviceToggle.tsx`
  inside `NotificationPreferences`.
- Proxies `push-vapid-public-key` (GET, no auth; `publicKey: null` means the server has no VAPID
  configured), `push-subscribe` and `push-unsubscribe` (POST, Bearer) → `services/notifications.ts`.
- Product rule: while the user has push active on any device, the backend sends the Gmail
  "items to review" alert by push instead of email (falls back to email only if push fails).

**Testing locally:** next-pwa is disabled under `NODE_ENV=development`, so `pnpm dev` has no
service worker and the toggle shows the "no service worker" state. Use `pnpm build && pnpm start`
instead; browsers allow push on `http://localhost` without HTTPS (any other host needs HTTPS).
iOS/iPadOS Safari only exposes push to the Home-Screen-installed app (iOS 16.4+).

### Structure

- `src/pages/` — routed pages: `auth/*` (login/register/forgot-password/verify-2fa),
  `dashboard`, `entries` (income), `expenditures` (transactions), `fixed-expenses` (recurring
  costs — CRUD plus a "mark as paid" action that generates a `Transaction`, see
  `prospero-backend/CLAUDE.md`'s `fixed-expenses` module), `goals` (placeholder — the spec marks
  detailed savings goals as post-MVP), `settings`, `budget-calculator`, `profile/*` (incl. 2FA
  setup/verify flows). All except `goals` and the `auth/*` pages use `getServerSideProps`
  (needed for the auth token + per-user data).
- `src/components/views/` — page-level feature components (`auth`, `budgetCalculator`,
  `profile`), separate from `components/ui` (design-system primitives) and `components/layouts`.
- `src/services/` — backend-calling functions, either wrapped by a proxy route or called
  directly from `getServerSideProps`: `2fa.ts`, `budgetCalculator.ts`, `userService.ts`,
  `request-profile.ts`, `login.ts`, `salary.ts`, `transactions.ts`, `fixedExpenses.ts`,
  `notifications.ts` (preferences + Web Push subscriptions), among others.
- `src/lib/` — shared non-React helpers (`apiService`, `createHandler`, `session`, `webPush`,
  `signOutAndUnsubscribePush`, …).
- `src/hooks`, `src/interfaces`, `src/types`, `src/enums` — shared frontend-only types/enums
  (e.g. `HttpMethod`) and hooks (e.g. `usePushSubscription`).
- `worker/` — custom service worker source bundled into `public/sw.js` by next-pwa (see Web Push
  above). `public/sw.js`, `public/workbox-*.js` and `public/worker-*.js` are build output
  (gitignored).

### Related repo

Password-reset emails sent by the backend link to the separate `prosper-change-password` app
(a standalone Vite SPA), not a page in this Next.js app.
