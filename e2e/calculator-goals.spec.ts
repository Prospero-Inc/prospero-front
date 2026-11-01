import { expect, type Page, test } from '@playwright/test'

// Calculadora y Metas (docs/diseno-mobile.html, 14).

// page.route can't see requests the service worker handles.
test.use({ serviceWorkers: 'block' })

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

test('the calculator splits as you type, with your own split', async ({
  page
}) => {
  // This account splits 55 / 25 / 20.
  await page.route('**/api/proxy/read/auth/profile*', route =>
    route.fulfill({
      json: {
        msg: 'Profile',
        user: {
          id: 1,
          email: 'ana@example.com',
          username: 'ana',
          firstName: 'Ana',
          lastName: 'Martínez',
          enable2FA: false,
          payFrequency: 'Biweekly',
          needsPercent: 0.55,
          wantsPercent: 0.25,
          savingsPercent: 0.2
        }
      }
    })
  )
  await login(page)
  await page.goto('/more')
  await page.getByRole('link', { name: 'Calculadora de presupuesto' }).click()
  await page.waitForURL('**/budget-calculator')

  await expect(page.getByText('Con tu reparto 55 / 25 / 20')).toBeVisible()
  // No button: it recalculates while typing (a comma works too).
  await page.getByLabel('Monto del pago').fill('650')
  await expect(page.getByText('$357.50')).toBeVisible()
  await expect(page.getByText('$162.50')).toBeVisible()
  await expect(page.getByText('$130.00')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Calcular/ })).toHaveCount(0)

  await page
    .getByRole('button', { name: '¿Cómo funciona el 55 / 25 / 20?' })
    .click()
  await expect(
    page.getByRole('dialog', { name: '¿Cómo funciona?' })
  ).toBeVisible()
})

test('Metas is a "coming soon" page out of the navigation', async ({
  page
}) => {
  await login(page)
  await expect(
    page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Metas' })
  ).toHaveCount(0)

  await page.goto('/goals')
  await expect(
    page.getByRole('heading', { name: 'Metas de ahorro, muy pronto' })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Volver al inicio' })
  ).toHaveAttribute('href', /\/dashboard$/)
})
