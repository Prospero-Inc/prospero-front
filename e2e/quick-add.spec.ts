import { expect, type Page, test } from '@playwright/test'

// Wave 4b: "+" logs a movement in three taps from anywhere; the dashboard
// leads with what's left to spend.

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

const lastPost = async (page: Page, path: string) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === 'POST' && r.path === path).at(-1)
}

const openQuickAdd = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: 'Agregar movimiento' })
    .click()

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('logs an expense in three taps', async ({ page }) => {
  await openQuickAdd(page)
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await expect(sheet).toBeVisible()
  const amount = sheet.getByLabel('Monto')
  await expect(amount).toBeFocused()
  await expect(amount).toHaveAttribute('inputmode', 'decimal')

  const save = sheet.getByRole('button', { name: 'Guardar gasto' })
  await amount.fill('12,50') // comma decimal, as Spanish keyboards type it
  await expect(save).toBeDisabled() // still needs a category
  await sheet.getByRole('button', { name: 'Deseo' }).click()
  await save.click()

  await expect(sheet).toBeHidden()
  await expect
    .poll(() => lastPost(page, '/api/transactions'))
    .toMatchObject({
      body: { amount: 12.5, category: 'Deseo', date: expect.any(String) }
    })
})

test('logs a payroll income', async ({ page }) => {
  await openQuickAdd(page)
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await sheet.getByRole('button', { name: 'Ingreso' }).click()
  await sheet.getByLabel('Monto').fill('650')
  await sheet.getByRole('button', { name: 'Nómina' }).click()
  await sheet.getByRole('button', { name: 'Guardar ingreso' }).click()

  await expect(sheet).toBeHidden()
  await expect
    .poll(() => lastPost(page, '/api/salary'))
    .toMatchObject({ body: { amount: 650, type: 'Payroll' } })
})

test('rejects an amount that is not a number', async ({ page }) => {
  await openQuickAdd(page)
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await sheet.getByLabel('Monto').fill('12.345')
  await sheet.getByRole('button', { name: 'Necesidad' }).click()

  await expect(sheet.getByText('Ingresá un monto mayor a 0')).toBeVisible()
  await expect(
    sheet.getByRole('button', { name: 'Guardar gasto' })
  ).toBeDisabled()
})

test.describe('dashboard', () => {
  // page.route can't see requests the service worker handles.
  test.use({ serviceWorkers: 'block' })

  test('leads with what is left to spend', async ({ page }) => {
    const budget = (budgeted: number, spent: number) => ({
      budgeted,
      spent,
      remaining: budgeted - spent
    })
    await page.route('**/api/proxy/read/periods/current', route =>
      route.fulfill({
        json: {
          key: '2026-10-16',
          startDate: '2026-10-16',
          endDate: null,
          isOpen: true,
          income: 650,
          totalSpent: 412.35,
          balance: 237.65,
          budget: {
            necesidad: budget(325, 248.1),
            deseo: budget(195, 131.25),
            ahorro: budget(130, 33)
          },
          daysElapsed: 10,
          estimatedNextPaymentDate: '2026-11-01',
          estimatedDaysRemaining: 5,
          recentTransactions: []
        }
      })
    )
    await page.reload()

    await expect(page.getByText('Te quedan para este período')).toBeVisible()
    await expect(page.getByText('$237.65')).toBeVisible()
    await expect(page.getByText('Unos $47 por día')).toBeVisible()
    await expect(page.getByText('50 · 30 · 20')).toBeVisible()
  })
})
