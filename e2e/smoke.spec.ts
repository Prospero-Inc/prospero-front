import { expect, type Page, test } from '@playwright/test'

const BACKEND = 'http://localhost:4555'

interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

const backendRequests = async (page: Page): Promise<RecordedRequest[]> =>
  (await page.request.get(`${BACKEND}/__requests`)).json()

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

/** The page must fit the phone's width: no sideways scrolling. */
const expectNoHorizontalScroll = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('logs in and lands on the dashboard', async ({ page }) => {
  await login(page)

  await expect(page).toHaveURL(/\/dashboard$/)
  await expectNoHorizontalScroll(page)
})

test('adds an expense from the expenditures page', async ({ page }) => {
  await login(page)
  await page.goto('/expenditures')

  await page.getByRole('button', { name: 'Nuevo gasto' }).click()
  await page.getByLabel('Monto').fill('12.50')
  await page.getByRole('button', { name: 'Guardar gasto' }).click()

  await expect
    .poll(async () =>
      (
        await backendRequests(page)
      ).filter(
        request =>
          request.method === 'POST' && request.path === '/api/transactions'
      )
    )
    .toContainEqual(
      expect.objectContaining({
        body: expect.objectContaining({ amount: 12.5, category: 'Necesidad' })
      })
    )
  await expectNoHorizontalScroll(page)
})
