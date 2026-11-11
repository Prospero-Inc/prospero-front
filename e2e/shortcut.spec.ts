import { expect, type Page, test } from '@playwright/test'

// Atajo de iPhone (Más → Conexiones): token → install → automation, the
// tokens created so far and each Wallet card's category. The fake backend
// has one token in use, one revoked and two cards.

// page.route() can't see requests the service worker makes.
test.use({ serviceWorkers: 'block' })

const BACKEND = 'http://localhost:4555'

const login = async (page: Page) => {
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
  await page
    .locator('form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click()
  await page.waitForURL('**/dashboard')
}

type Logged = { method: string; path: string; body: unknown }

const requestsTo = async (page: Page, method: string, path: string) => {
  const requests: Logged[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === method && r.path === path)
}

const heading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Atajo de iPhone' })

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('opens from "Más", which says it is active', async ({ page }) => {
  await page.goto('/more')
  const row = page.getByRole('link', { name: /^Atajo de iPhone/ })
  await expect(row).toContainText('Activo')
  await row.click()
  await page.waitForURL('**/settings/shortcut')
  await expect(heading(page)).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeHidden()
  await expect(page.getByRole('link', { name: 'Más' })).toBeVisible()

  for (const step of [
    'Generá tu token',
    'Instalá el atajo',
    'Activalo al pagar'
  ])
    await expect(page.getByRole('heading', { name: step })).toBeVisible()
  // No screenshots yet: one placeholder per step.
  await expect(page.getByText(/Captura del paso \d \(pendiente\)/)).toHaveCount(
    3
  )
  // NEXT_PUBLIC_SHORTCUT_ICLOUD_URL isn't set in this build.
  await expect(
    page.getByRole('button', { name: 'Instalar el atajo' })
  ).toBeDisabled()
  await expect(page.getByText('Enlace no disponible todavía')).toBeVisible()
})

test('says it needs an iPhone everywhere else', async ({ page }, testInfo) => {
  await page.goto('/settings/shortcut')
  await expect(heading(page)).toBeVisible()
  const notice = page.getByText(
    /Esto funciona en iPhone con iOS 17 o posterior/
  )
  // The "iphone" project has an iPhone user agent, "pixel" an Android one.
  if (testInfo.project.name === 'iphone') {
    await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()
    await expect(notice).toBeHidden()
  } else await expect(notice).toBeVisible()
  // Tokens and cards can still be set up from here.
  await expect(
    page.getByRole('article', { name: 'iPhone · 3 nov' })
  ).toBeVisible()
  await expect(page.getByText('BAC Visa')).toBeVisible()
})

test('creating a token shows it once and copies it', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/settings/shortcut')
  await page.getByRole('button', { name: 'Generar y copiar token' }).click()

  const field = page.getByLabel('Tu token')
  await expect(field).toHaveValue('prs_fake0123456789abcdef')
  await expect(page.getByText(/Solo lo vas a ver esta vez/)).toBeVisible()
  await expect(page.getByText('Token copiado')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'prs_fake0123456789abcdef'
  )

  const [created] = (
    await requestsTo(page, 'POST', '/api/shortcuts/tokens')
  ).slice(-1)
  expect(created.body).toMatchObject({
    name: expect.stringMatching(/^iPhone · /)
  })

  // "Copiar" copies it again.
  await page.evaluate(() => navigator.clipboard.writeText(''))
  await page.getByRole('button', { name: 'Copiar', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('prs_fake0123456789abcdef')
})

test('revoking a token asks first', async ({ page }) => {
  await page.goto('/settings/shortcut')
  const token = page.getByRole('article', { name: 'iPhone · 3 nov' })
  await expect(token).toContainText(/Último gasto recibido: hace \d+ minutos/)
  await expect(
    page.getByRole('article', { name: 'iPhone viejo' })
  ).toContainText('Revocado')
  await expect(
    page.getByRole('article', { name: 'iPhone viejo' })
  ).toContainText('Todavía no recibió gastos')

  const revoke = page.getByRole('button', { name: 'Revocar iPhone · 3 nov' })
  // The fake backend is shared with the other device's run of this test:
  // count only that a new revoke arrived.
  const before = (
    await requestsTo(page, 'POST', '/api/shortcuts/tokens/2/revoke')
  ).length

  // Cancel: nothing is sent.
  await revoke.click()
  let sheet = page.getByRole('dialog', { name: '¿Revocar este token?' })
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: 'Cancelar' }).click()
  await expect(sheet).toBeHidden()

  await revoke.click()
  sheet = page.getByRole('dialog', { name: '¿Revocar este token?' })
  await sheet.getByRole('button', { name: 'Revocar', exact: true }).click()
  await expect(page.getByText('Token revocado')).toBeVisible()
  await expect
    .poll(
      async () =>
        (
          await requestsTo(page, 'POST', '/api/shortcuts/tokens/2/revoke')
        ).length
    )
    .toBeGreaterThan(before)
})

test("a card's category is saved on tap", async ({ page }) => {
  await page.goto('/settings/shortcut')
  const visa = page.getByRole('group', { name: 'Categoría de BAC Visa' })
  await expect(visa.getByRole('button', { name: 'Deseo' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  await visa.getByRole('button', { name: 'Según el comercio' }).click()
  await expect(
    visa.getByRole('button', { name: 'Según el comercio' })
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByText('Listo: BAC Visa → Según el comercio')
  ).toBeVisible()
  await expect
    .poll(async () =>
      (await requestsTo(page, 'PATCH', '/api/wallet-cards/1')).map(r => r.body)
    )
    .toContainEqual({ defaultCategory: null })

  await page
    .getByRole('group', { name: 'Categoría de Débito Agrícola' })
    .getByRole('button', { name: 'Ahorro' })
    .click()
  await expect
    .poll(async () =>
      (await requestsTo(page, 'PATCH', '/api/wallet-cards/2')).map(r => r.body)
    )
    .toContainEqual({ defaultCategory: 'Ahorro' })
})

const shortcutExpense = {
  id: 77,
  amount: 9.5,
  date: '2026-10-30T00:00:00.000Z',
  category: null,
  suggestedCategory: 'Deseo',
  description: 'Starbucks',
  source: 'Shortcut',
  reviewStatus: 'PendingReview',
  fixedExpenseName: null,
  institutionName: null,
  possibleGmailDuplicate: null,
  periodOverride: null
}

test('iPhone expenses: "iPhone" in the list, suggestion in the queue', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        {
          ...shortcutExpense,
          id: 78,
          description: 'Super Selectos',
          category: 'Necesidad',
          reviewStatus: 'Confirmed'
        }
      ]
    })
  )
  await page.route('**/api/proxy/read/transactions*', route =>
    route.fulfill({ json: [shortcutExpense] })
  )
  await page.route('**/api/proxy/read/salary*', route =>
    route.fulfill({ json: [] })
  )

  await page.goto('/movements')
  await expect(
    page.getByRole('button', { name: 'Editar Super Selectos' })
  ).toContainText('Necesidades · iPhone')

  await page.goto('/review')
  const card = page.getByRole('article').filter({ hasText: 'Starbucks' })
  await expect(
    card.getByRole('button', { name: 'Deseo (sugerida)' })
  ).toBeVisible()
  await expect(card.getByRole('button', { name: 'Necesidad' })).toBeVisible()
})
