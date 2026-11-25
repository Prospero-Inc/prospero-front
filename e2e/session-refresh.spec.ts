import { expect, type Page, test } from '@playwright/test'

// F2: the access token is renewed before it expires, and a request that
// still gets a 401 is retried once with a renewed token. The fake backend
// keys this off the login email (see `TAGGED` in e2e/fake-backend.mjs).

const BACKEND = 'http://localhost:4555'

interface RecordedRequest {
  method: string
  path: string
  body: unknown
  headers: Record<string, string | undefined>
}

const backendRequests = async (page: Page): Promise<RecordedRequest[]> =>
  (await page.request.get(`${BACKEND}/__requests`)).json()

const login = async (page: Page, email: string) => {
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
  await page
    .locator('form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click()
  await page.waitForURL('**/dashboard')
}

test('renews a token that expires within the margin, before it expires', async ({
  page
}, testInfo) => {
  const tag = `expiring.${testInfo.project.name}`
  await login(page, `${tag}@example.com`)

  // 330 s left is inside the 360 s margin: the session read on load renews it
  // (before the fix it was only renewed once already expired).
  await expect
    .poll(async () =>
      (
        await backendRequests(page)
      ).some(
        r =>
          r.method === 'POST' &&
          r.path === '/api/auth/refresh' &&
          String(
            (r.body as { refreshToken?: string } | undefined)?.refreshToken
          ).startsWith(`fake-refresh-${tag}-`)
      )
    )
    .toBe(true)
  await page.reload()
  await expect
    .poll(async () =>
      (
        await backendRequests(page)
      ).some(
        r =>
          r.path === '/api/periods/current' &&
          r.headers.authorization === `Bearer fake-access-token-renewed-${tag}`
      )
    )
    .toBe(true)
})

test('retries a save once with a renewed token after a 401', async ({
  page
}, testInfo) => {
  const tag = `dying.${testInfo.project.name}`
  await login(page, `${tag}@example.com`)

  // Past the backend's 3 s life for this token and inside the renewal margin
  // (368 s - 360 s): the tab still holds the dead token until the next poll.
  await page.waitForTimeout(9_000)

  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: 'Agregar movimiento' })
    .click()
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await sheet.getByLabel('Monto').fill('31,07')
  await sheet.getByRole('button', { name: 'Necesidad' }).click()
  await sheet.getByRole('button', { name: 'Guardar gasto' }).click()
  await expect(sheet).toBeHidden()

  const savedWith = async () =>
    (await backendRequests(page))
      .filter(
        r =>
          r.method === 'POST' &&
          r.path === '/api/transactions' &&
          r.headers.authorization?.includes(tag)
      )
      .map(r => r.headers.authorization)
  await expect
    .poll(savedWith)
    .toEqual([
      expect.stringMatching(
        new RegExp(`^Bearer fake-access-token-${tag}-\\d+$`)
      ),
      `Bearer fake-access-token-renewed-${tag}`
    ])
})
