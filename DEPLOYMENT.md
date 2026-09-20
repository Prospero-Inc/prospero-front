# Deployment

This repo ships with a working CI/CD pipeline
(`.github/workflows/nextjs.deployment.yml`): every push to `main` lints,
then rebuilds and restarts the app via Docker Compose, on a **self-hosted
GitHub Actions runner** (a real server you control, not GitHub's own
infra). `develop` is the integration branch and does **not** deploy on its
own — merge `develop` → `main` when you actually want to ship.

See `prospero-backend/DEPLOYMENT.md` for the full server setup (getting a
free VM, installing Docker, creating the `prospero` external network,
registering a runner). This app needs its **own** separate runner
registration (repo Settings → Actions → Runners), but can live on the same
physical server as the backend — it must, in fact, since it talks to the
backend over that shared `prospero` Docker network by container/service
name (`NEXT_PUBLIC_API_URL` typically points at `http://backend:3000/api`
or whatever the backend's service is named on that network, not
`localhost`).

## Required GitHub Actions secrets

Set these under this repo's Settings → Secrets and variables → Actions:

| Secret | What it is |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the browser/server use to reach `prospero-backend`, including the `/api` prefix. Gets baked into the client bundle at build time (it's a `NEXT_PUBLIC_*` var), so it must be set correctly before `docker compose up --build`. |
| `NEXTAUTH_URL` | The browser-facing public URL of this app itself (e.g. `https://app.yourdomain.com`) |
| `NEXTAUTH_SECRET` | Secret NextAuth uses to sign session JWTs/cookies — any long random string, e.g. `openssl rand -hex 32` |
| `AUTH_SECRET` | Same value as `NEXTAUTH_SECRET` — some next-auth helpers read this name instead; both must be set to avoid silent auth failures |

If the port this app is reachable on externally differs from the port it
listens on internally (like local dev's `4000:3000` mapping), you'll also
need `NEXTAUTH_URL_INTERNAL` — see the comment in `.env.example` for why.
Not required for a plain 1:1 port setup.

## Deploying

```bash
git push origin main
```

(after merging `develop` into it). Watch the run under this repo's Actions
tab — it stops the existing container, prunes the old image, and rebuilds.
