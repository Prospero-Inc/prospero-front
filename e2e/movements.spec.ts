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

  const expenseRow = page.getByRole('link', { name: 'Súper Selectos' })
  const incomeRow = page.getByRole('link', { name: 'Venta de artesanías' })
  await expect(expenseRow).toBeVisible()
  await expect(incomeRow).toBeVisible()
  await expect(expenseRow).toHaveAttribute('href', /\/expenditures\?edit=1$/)

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
  // The fake backend is shared by both device projects: count from here.
  const before = (await patches(page)).length

  // Tap, then undo: the card comes back and nothing reached the backend.
  await card.getByRole('button', { name: 'Deseo' }).click()
  await expect(card).toBeHidden()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(card).toBeVisible()
  expect(await patches(page)).toHaveLength(before)

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
