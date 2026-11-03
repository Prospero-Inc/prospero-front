import { expect, type Page, test } from '@playwright/test'

// Wave 4c: one list for expenses and income, and the Gmail review queue
// with one-tap confirm and "Deshacer".

// page.route can't see requests the service worker handles.
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

const patches = async (page: Page) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === 'PATCH')
}

const expense = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  amount: 14,
  date: '2026-10-30T00:00:00.000Z',
  category: null,
  description: 'Cinemark',
  source: 'Gmail',
  reviewStatus: 'PendingReview',
  fixedExpenseName: null,
  institutionName: 'BAC',
  possibleGmailDuplicate: null,
  periodOverride: null,
  ...extra
})

test('movements lists expenses and income together, filterable', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        expense(1, {
          description: 'Súper Selectos',
          category: 'Necesidad',
          reviewStatus: 'Confirmed',
          source: 'Manual',
          institutionName: null
        })
      ]
    })
  )
  await page.route('**/api/proxy/read/periods/salary*', route =>
    route.fulfill({
      json: [
        {
          id: 7,
          amount: 40,
          date: '2026-10-29T00:00:00.000Z',
          type: 'Extra',
          status: 'Classified',
          incomeCategory: 'Extra',
          description: 'Venta de artesanías',
          source: 'Manual',
          institutionName: null,
          possibleGmailDuplicate: null
        }
      ]
    })
  )
  await login(page)
  await page.goto('/movements')

  // Rows open the edit sheet (e2e/movements-edit.spec.ts).
  const expenseRow = page.getByRole('button', { name: 'Editar Súper Selectos' })
  const incomeRow = page.getByRole('button', {
    name: 'Editar Venta de artesanías'
  })
  await expect(expenseRow).toBeVisible()
  await expect(incomeRow).toBeVisible()

  await page.getByRole('button', { name: 'Gastos' }).click()
  await expect(expenseRow).toBeVisible()
  await expect(incomeRow).toBeHidden()
})

test('review: one tap confirms, "Deshacer" cancels before anything is sent', async ({
  page
}) => {
  await page.route('**/api/proxy/read/transactions*', route =>
    route.fulfill({ json: [expense(42)] })
  )
  await page.route('**/api/proxy/read/salary*', route =>
    route.fulfill({ json: [] })
  )
  await login(page)
  await page.goto('/review')
  const card = page.getByRole('article').filter({ hasText: 'Cinemark' })
  await expect(card).toBeVisible()
  // Tap, then undo: the card comes back and nothing reached the backend.
  // (The fake backend is shared by every test running in parallel, so look
  // for this exact change, not at how many PATCHes there are.)
  const undone = (rows: { path: string; body: unknown }[]) =>
    rows.filter(
      row =>
        row.path === '/api/transactions/42' &&
        (row.body as { category?: string })?.category === 'Deseo'
    )
  await card.getByRole('button', { name: 'Deseo' }).click()
  await expect(card).toBeHidden()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(card).toBeVisible()
  // Past the 5 s window: had undo failed, it would have been sent by now.
  await page.waitForTimeout(6_000)
  expect(undone(await patches(page))).toHaveLength(0)

  // Tap and let the undo window pass: now it's sent.
  await card.getByRole('button', { name: 'Necesidad' }).click()
  await expect(card).toBeHidden()
  await expect
    .poll(() => patches(page), { timeout: 10_000 })
    .toContainEqual(
      expect.objectContaining({
        path: '/api/transactions/42',
        body: expect.objectContaining({ category: 'Necesidad' })
      })
    )
})

test('review: "Editar antes de guardar" corrects in the sheet and stays in the queue', async ({
  page
}) => {
  await page.route('**/api/proxy/read/transactions*', route =>
    route.fulfill({ json: [expense(43, { description: 'Pizza' })] })
  )
  await page.route('**/api/proxy/read/salary*', route =>
    route.fulfill({ json: [] })
  )
  await login(page)
  await page.goto('/review')
  const card = page.getByRole('article').filter({ hasText: 'Pizza' })
  await card.getByRole('button', { name: 'Editar antes de guardar' }).click()

  const sheet = page.getByRole('dialog', { name: 'Editar gasto' })
  await expect(sheet).toBeVisible()
  await expect(page).toHaveURL(/\/review$/)
  await sheet.getByLabel('Monto').fill('20')
  await sheet.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(sheet).toBeHidden()

  // No category sent: the API keeps it pending until it's chosen. (The fake
  // backend is shared with the other device's run of this test.)
  await expect
    .poll(() => patches(page))
    .toContainEqual(
      expect.objectContaining({
        path: '/api/transactions/43',
        body: { amount: 20 }
      })
    )
  await expect(card).toBeVisible()
})

test('the old list pages redirect to the new screens', async ({ page }) => {
  await login(page)

  await page.goto('/expenditures')
  await expect(page).toHaveURL(/\/review$/)

  await page.goto('/entries')
  await expect(page).toHaveURL(/\/movements\?kind=income$/)

  // Links from before the edit sheet existed have nowhere else to go.
  await page.goto('/expenditures?edit=1')
  await expect(page).toHaveURL(/\/review\?edit=1$/)
})

test('movements: a possible Gmail duplicate can be settled', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        expense(44, {
          category: 'Deseo',
          reviewStatus: 'Confirmed',
          possibleGmailDuplicate: {
            id: 9,
            senderEmail: 'avisos@bac.com',
            processedAt: '2026-10-30T12:00:00.000Z'
          }
        })
      ]
    })
  )
  let dismissed = false
  await page.route('**/api/proxy/dismiss-processed-email*', route => {
    dismissed = route.request().url().includes('id=9')
    return route.fulfill({ json: {} })
  })
  await login(page)
  await page.goto('/movements')

  const card = page.getByRole('article').filter({ hasText: 'avisos@bac.com' })
  await card.getByRole('button', { name: 'Es el mismo movimiento' }).click()
  await page
    .getByRole('alertdialog')
    .or(page.getByRole('dialog'))
    .getByRole('button', { name: 'Descartar' })
    .click()

  await expect.poll(() => dismissed).toBe(true)
})
