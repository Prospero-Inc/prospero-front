import { expect, type Page, test } from '@playwright/test'

// Atajo de iPhone (docs/diseno-mobile.html, 18–20). The fake backend says
// the shortcut already works (an expense two hours ago), with one token in
// use, one revoked and two Wallet cards; the setup tests override
// /shortcuts/status to "nothing received yet".

// page.route() can't see requests the service worker makes.
test.use({ serviceWorkers: 'block' })

const BACKEND = 'http://localhost:4555'
const TOKEN = 'prs_fake0123456789abcdef'

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

/** Nothing received yet: the setup steps. */
const notSetUp = (page: Page) =>
  page.route('**/api/proxy/read/shortcuts/status*', route =>
    route.fulfill({ json: { lastTransaction: null } })
  )

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('working: last expense, Wallet cards and tokens', async ({ page }) => {
  await page.goto('/more')
  const row = page.getByRole('link', { name: /^Atajo de iPhone/ })
  await expect(row).toContainText('Activo')
  await row.click()
  await page.waitForURL('**/settings/shortcut')
  await expect(heading(page)).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeHidden()

  const live = page.getByRole('status').filter({ hasText: 'Funcionando' })
  await expect(live).toContainText(
    'Último gasto recibido: hace 2 horas · Puma, $25.00'
  )
  // No steps while it works.
  await expect(
    page.getByRole('heading', { name: /Generá tu token/ })
  ).toBeHidden()

  // Cards: count, "Nueva" and the category pill.
  await expect(
    page.getByRole('heading', { name: 'Tus tarjetas de Wallet' })
  ).toBeVisible()
  const visa = page.getByRole('button', { name: /^BAC Visa/ })
  await expect(visa).toContainText('Nueva')
  await expect(visa).toContainText('Según el comercio')
  await expect(
    page.getByRole('button', { name: /^Débito Agrícola/ })
  ).toContainText('Siempre Necesidad')

  // Tokens: only the live one, as the design's row.
  const token = page.getByRole('article', { name: 'iPhone · 3 nov' })
  await expect(token).toContainText(/Creado el 3 nov.* · usado hace 5 min/)
  await expect(page.getByRole('article', { name: 'iPhone viejo' })).toHaveCount(
    0
  )

  await page.getByRole('button', { name: 'Ver instrucciones otra vez' }).click()
  await expect(
    page.getByRole('heading', { name: /Generá tu token/ })
  ).toBeVisible()
  await expect(live).toBeHidden()
})

test('setup: three steps, the install link and the note', async ({ page }) => {
  await notSetUp(page)
  await page.goto('/settings/shortcut')
  await expect(heading(page)).toBeVisible()
  await expect(
    page.getByText(
      'Cada vez que pagués acercando el iPhone o el Watch, el gasto se guarda solo en Prospero.'
    )
  ).toBeVisible()
  const steps = page.getByRole('list', { name: 'Pasos para configurarlo' })
  await expect(steps.getByRole('heading')).toHaveText([
    'Paso 1, ahora: Generá tu token',
    'Paso 2: Instalá el atajo',
    'Paso 3: Activalo al pagar'
  ])
  await expect(steps).toContainText(
    'Atajos › Automatización › Nueva › Transacción › elegí tus tarjetas › Ejecutar inmediatamente › elegí Prospero · Guardar gasto'
  )
  // No screenshots yet, so no "Ver con capturas".
  await expect(page.getByText('Ver con capturas')).toHaveCount(0)
  // NEXT_PUBLIC_SHORTCUT_ICLOUD_URL isn't set in this build.
  await expect(
    page.getByRole('button', { name: 'Instalar "Prospero · Guardar gasto"' })
  ).toBeDisabled()
  await expect(page.getByText('Enlace no disponible todavía')).toBeVisible()
  await expect(
    page.getByText(/^Funciona con iPhone y iOS 17 o posterior/)
  ).toBeVisible()
  // Cards and tokens only once it works.
  await expect(page.getByText('Tus tarjetas de Wallet')).toHaveCount(0)
})

test('setup: the token is copied and then masked', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await notSetUp(page)
  await page.goto('/settings/shortcut')
  await page.getByRole('button', { name: 'Generar y copiar token' }).click()

  const box = page.getByRole('group', { name: 'Tu token' })
  await expect(box).toContainText('Copiado')
  await expect(page.getByTestId('shortcut-token')).toHaveText(
    'prs_••••••••••••cdef'
  )
  await expect(
    page.getByText('Se muestra una sola vez. Si lo perdés, generá otro.')
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(TOKEN)
  await expect(
    page
      .getByRole('list', { name: 'Pasos para configurarlo' })
      .getByRole('heading')
  ).toHaveText([
    'Paso 1, listo: Generá tu token',
    'Paso 2, ahora: Instalá el atajo',
    'Paso 3: Activalo al pagar'
  ])

  const [created] = (
    await requestsTo(page, 'POST', '/api/shortcuts/tokens')
  ).slice(-1)
  expect(created.body).toMatchObject({
    name: expect.stringMatching(/^iPhone · /)
  })
})

test('setup: when copying fails the whole token shows, with "Copiar"', async ({
  page,
  context
}) => {
  await notSetUp(page)
  // No clipboard permission: the browser refuses to copy.
  await page.goto('/settings/shortcut')
  await page.getByRole('button', { name: 'Generar y copiar token' }).click()
  await expect(page.getByTestId('shortcut-token')).toHaveText(TOKEN)
  const copy = page
    .getByRole('group', { name: 'Tu token' })
    .getByRole('button', { name: 'Copiar' })
  await expect(copy).toBeVisible()

  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await copy.click()
  await expect(page.getByTestId('shortcut-token')).toHaveText(
    'prs_••••••••••••cdef'
  )
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(TOKEN)
})

test('revoking a token asks first', async ({ page }) => {
  await page.goto('/settings/shortcut')
  const revoke = page.getByRole('button', { name: 'Revocar iPhone · 3 nov' })
  // The fake backend is shared with the other device's run of this test:
  // count only that a new revoke arrived.
  const before = (
    await requestsTo(page, 'POST', '/api/shortcuts/tokens/2/revoke')
  ).length

  await revoke.click()
  let sheet = page.getByRole('dialog', { name: '¿Revocar este token?' })
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

test("a card's category is chosen in a sheet and saved with Guardar", async ({
  page
}) => {
  await page.goto('/settings/shortcut')
  const patches = async () =>
    (await requestsTo(page, 'PATCH', '/api/wallet-cards/1')).map(r => r.body)
  // This page's own requests (the fake backend is shared with the other
  // device's run of this test).
  const sent: string[] = []
  page.on('request', request => {
    if (request.url().includes('/api/proxy/update-wallet-card'))
      sent.push(request.url())
  })

  await page.getByRole('button', { name: /^BAC Visa/ }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('BAC Visa')
  await expect(sheet).toContainText('¿En qué categoría van sus gastos?')
  await expect(
    sheet.getByRole('radio', { name: /Según el comercio/ })
  ).toHaveAttribute('aria-checked', 'true')
  await expect(sheet).toContainText(
    /^.*Un comercio que ya conocemos siempre gana/
  )

  await sheet.getByRole('radio', { name: /Siempre Ahorro/ }).click()
  await expect(
    sheet.getByRole('radio', { name: /Siempre Ahorro/ })
  ).toHaveAttribute('aria-checked', 'true')
  // Nothing is sent until "Guardar".
  expect(sent).toEqual([])

  await sheet.getByRole('button', { name: 'Guardar' }).click()
  await expect(sheet).toBeHidden()
  await expect.poll(patches).toContainEqual({ defaultCategory: 'Ahorro' })
})

const shortcutExpense = {
  id: 77,
  amount: 14.5,
  date: '2026-11-11T10:38:00.000Z',
  category: null,
  suggestedCategory: 'Deseo',
  description: 'La Neveria Escalón',
  source: 'Shortcut',
  reviewStatus: 'PendingReview',
  fixedExpenseName: null,
  institutionName: null,
  walletCard: { id: 1, name: 'BAC Visa' },
  possibleGmailDuplicate: null,
  periodOverride: null
}

test('review: an iPhone expense, its suggestion and "Recordar"', async ({
  page
}) => {
  await page.route('**/api/proxy/read/transactions*', route =>
    route.fulfill({ json: [shortcutExpense] })
  )
  await page.route('**/api/proxy/read/salary*', route =>
    route.fulfill({ json: [] })
  )
  await page.goto('/review')
  const card = page
    .getByRole('article')
    .filter({ hasText: 'La Neveria Escalón' })
  await expect(card).toContainText(/iPhone · BAC Visa · 10:38/)
  await expect(card).toContainText('Comercio nuevo. ¿Qué tipo de gasto es?')
  await expect(card.getByRole('button', { name: 'Deseo' })).toHaveAttribute(
    'data-suggested',
    'true'
  )
  const remember = card.getByRole('checkbox', {
    name: 'Recordar para La Neveria Escalón: la próxima vez se guarda solo'
  })
  await expect(remember).toHaveAttribute('aria-checked', 'true')
  await remember.click()
  await expect(remember).toHaveAttribute('aria-checked', 'false')

  await card.getByRole('button', { name: 'Necesidad' }).click()
  // Sent once the 5 s "Deshacer" window is over.
  await expect
    .poll(
      async () =>
        (
          await requestsTo(page, 'PATCH', '/api/transactions/77')
        ).map(r => r.body),
      { timeout: 15_000 }
    )
    .toContainEqual({ category: 'Necesidad', rememberMerchant: false })
})

test('movements: iPhone as the origin', async ({ page }) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        {
          ...shortcutExpense,
          id: 78,
          description: 'Puma',
          category: 'Necesidad',
          reviewStatus: 'Confirmed'
        }
      ]
    })
  )
  await page.goto('/movements')
  const row = page.getByRole('button', { name: 'Editar Puma' })
  await expect(row).toContainText(/Necesidades ·\s*iPhone/)
  await expect(row.locator('svg')).not.toHaveCount(0)
})
