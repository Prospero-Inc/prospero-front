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

test('movements: income waits for the expenses instead of showing alone', async ({
  page
}) => {
  let releaseExpenses = (): void => undefined
  const expensesHeld = new Promise<void>(resolve => {
    releaseExpenses = resolve
  })
  await page.route('**/api/proxy/read/periods/transactions*', async route => {
    await expensesHeld
    await route.fulfill({
      json: [
        expense(1, {
          description: 'Súper Selectos',
          category: 'Necesidad',
          reviewStatus: 'Confirmed'
        })
      ]
    })
  })
  await page.route('**/api/proxy/read/periods/salary*', route =>
    route.fulfill({
      json: [
        {
          id: 7,
          amount: 400,
          date: '2026-10-29T00:00:00.000Z',
          type: 'Payroll',
          status: 'Classified',
          incomeCategory: 'Payroll',
          description: 'Nómina',
          source: 'Manual',
          institutionName: null,
          possibleGmailDuplicate: null
        }
      ]
    })
  )
  await login(page)
  const incomeArrived = page.waitForResponse(
    '**/api/proxy/read/periods/salary*'
  )
  await page.goto('/movements')
  await incomeArrived

  const incomeRow = page.getByRole('button', { name: 'Editar Nómina' })
  const expenseRow = page.getByRole('button', { name: 'Editar Súper Selectos' })
  // Absence check: give React a moment to (wrongly) render the income alone.
  await page.waitForTimeout(500)
  await expect(incomeRow).toBeHidden()

  releaseExpenses()
  await expect(expenseRow).toBeVisible()
  await expect(incomeRow).toBeVisible()
})

test('movements: search filters as you type and keeps ?q= in the URL', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        expense(1, {
          description: 'Súper Selectos',
          category: 'Necesidad',
          reviewStatus: 'Confirmed'
        }),
        expense(2, {
          description: 'Pizza Hut',
          category: 'Deseo',
          reviewStatus: 'Confirmed'
        })
      ]
    })
  )
  await page.route('**/api/proxy/read/periods/salary*', route =>
    route.fulfill({ json: [] })
  )
  await login(page)
  const superRow = page.getByRole('button', { name: 'Editar Súper Selectos' })
  const pizzaRow = page.getByRole('button', { name: 'Editar Pizza Hut' })

  // A ?q= from the URL is respected on load.
  await page.goto('/movements?q=pizza')
  await expect(pizzaRow).toBeVisible()
  await expect(superRow).toBeHidden()
  const field = page.getByLabel('Buscar movimientos')
  await expect(field).toHaveValue('pizza')

  await field.fill('súper')
  await expect(superRow).toBeVisible()
  await expect(pizzaRow).toBeHidden()
  await expect(page).toHaveURL(/[?&]q=s%C3%BAper/)

  await field.fill('')
  await expect(pizzaRow).toBeVisible()
  await expect(page).not.toHaveURL(/[?&]q=/)
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

test('review: confirming many cards in a row re-reads the lists once', async ({
  page
}) => {
  // The queue as the backend sees it: a card leaves once its PATCH lands.
  const ids = [61, 62, 63, 64, 65, 66, 67, 68]
  const sent = new Set<number>()
  let reads = 0
  page.on('request', request => {
    const match = /update-transaction\?id=(\d+)/.exec(request.url())
    if (match) sent.add(Number(match[1]))
  })
  await page.route('**/api/proxy/read/transactions*', route => {
    reads += 1
    return route.fulfill({
      json: ids.filter(id => !sent.has(id)).map(id => expense(id))
    })
  })
  await page.route('**/api/proxy/read/salary*', route =>
    route.fulfill({ json: [] })
  )
  await login(page)
  await page.goto('/review')
  const cards = page.getByRole('article')
  await expect(cards).toHaveCount(ids.length)
  const readsBefore = reads

  for (let i = 0; i < ids.length; i += 1)
    await cards.first().getByRole('button', { name: 'Necesidad' }).click()
  await expect(cards).toHaveCount(0)

  // All sent after the undo window, then one quiet re-fetch.
  await expect.poll(() => sent.size, { timeout: 15_000 }).toBe(ids.length)
  await expect.poll(() => reads - readsBefore, { timeout: 5_000 }).toBe(1)
  await page.waitForTimeout(2_500)
  expect(reads - readsBefore).toBeLessThanOrEqual(2)
  await expect(cards).toHaveCount(0)
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
