import { expect, type Page, test } from '@playwright/test'

// Wave 4d: first steps — pay frequency, split (always 100 %), first income.

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

const lastRequest = async (page: Page, method: string, path: string) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === method && r.path === path).at(-1)
}

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('the empty dashboard leads to the first steps', async ({ page }) => {
  await page.getByRole('link', { name: /Elegir cómo repartir/ }).click()
  await page.waitForURL('**/welcome')
  await expect(page.getByText('Paso 1 de 3')).toBeVisible()
})

test('sets frequency, split and first payment', async ({ page }) => {
  await page.goto('/welcome')

  await page.getByRole('button', { name: 'Una vez al mes' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Paso 2 de 3')).toBeVisible()
  await page.getByRole('button', { name: 'Personalizado' }).click()
  // Raising needs takes the points from wants: always 100 %.
  await page.getByRole('button', { name: 'Subir Necesidades' }).click()
  await expect(page.getByText('55%')).toBeVisible()
  await expect(page.getByText('25%')).toBeVisible()
  await expect(page.getByText('20%')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Paso 3 de 3')).toBeVisible()
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/auth/profile'))
    .toMatchObject({
      body: {
        payFrequency: 'Monthly',
        needsPercent: 0.55,
        wantsPercent: 0.25,
        savingsPercent: 0.2
      }
    })

  await page.getByLabel('Monto').fill('650')
  await page.getByRole('button', { name: 'Guardar y empezar' }).click()
  await page.waitForURL('**/dashboard')
  await expect
    .poll(() => lastRequest(page, 'POST', '/api/salary'))
    .toMatchObject({ body: { amount: 650, type: 'Payroll' } })
})
