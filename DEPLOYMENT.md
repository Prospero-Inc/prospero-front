# Despliegue

Este repo trae un pipeline de CI/CD funcionando
(`.github/workflows/nextjs.deployment.yml`): cada push a `main` corre
lint, y luego reconstruye y reinicia la app vía Docker Compose, sobre un
**runner self-hosted de GitHub Actions** (un servidor real que tú
controlas, no infraestructura de GitHub). `develop` es la rama de
integración y **no** despliega por sí sola — mergea `develop` → `main`
cuando de verdad quieras publicar.

Ver `prospero-backend/DEPLOYMENT.md` para la configuración completa del
servidor (lanzar la instancia EC2, instalar Docker, crear la red externa
`prospero`, registrar un runner). Esta app necesita su **propio** registro
de runner (Settings → Actions → Runners de este repo), pero puede vivir en
el mismo servidor físico que el backend — de hecho debe, ya que habla con
el backend por esa red de Docker compartida (`NEXT_PUBLIC_API_URL`
normalmente apunta a `http://backend:3000/api` o como se llame el
servicio del backend en esa red, no a `localhost`).

## Secretos requeridos en GitHub Actions

Configúralos en Settings → Secrets and variables → Actions de este repo:

| Secreto | Qué es |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base que el navegador/servidor usan para llegar a `prospero-backend`, incluyendo el prefijo `/api`. Queda incrustada en el bundle del cliente en tiempo de build (es una variable `NEXT_PUBLIC_*`), así que debe estar bien puesta antes de `docker compose up --build`. |
| `NEXTAUTH_URL` | URL pública de esta app tal como la ve el navegador (ej. `https://app.tudominio.com`) |
| `NEXTAUTH_SECRET` | Secreto que NextAuth usa para firmar los JWT/cookies de sesión — cualquier string largo y aleatorio, ej. `openssl rand -hex 32` |
| `AUTH_SECRET` | Mismo valor que `NEXTAUTH_SECRET` — algunos helpers de next-auth leen este nombre en su lugar; hay que poner los dos o falla la autenticación silenciosamente |

Si el puerto por el que esta app es alcanzable desde afuera es distinto
al puerto en el que escucha por dentro (como el mapeo `4000:3000` del dev
local), también necesitas `NEXTAUTH_URL_INTERNAL` — ver el comentario en
`.env.example`. No hace falta si el puerto es 1:1.

## Desplegar

```bash
git push origin main
```

(después de mergear `develop` a `main`). Míralo en la pestaña Actions de
este repo — para el contenedor existente, limpia la imagen vieja, y
reconstruye.
