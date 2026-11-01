import { expect, type Page, test } from '@playwright/test'

// Estados (docs/diseno-mobile.html, 13 and 15): the first-use Inicio as a
// checklist, a failed load that never looks like "nothing here", the thin
// offline bar, and the server error page.

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

test('first use: Inicio is a checklist of three steps', async ({ page }) => {
  await login(page)
  await expect(
    page.getByRole('heading', {
      name: 'Registrá tu pago para ver cuánto te queda'
    })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Elegir cómo repartir/ })
  ).toHaveAttribute('href', /\/welcome$/)
  await expect(
    page.getByRole('link', { name: /Conectar Gmail/ })
  ).toHaveAttribute('href', /\/settings\/gmail$/)
  await expect(page.getByText('Todavía no hay movimientos')).toBeVisible()

  // "Agregar" opens the "+" sheet already on a payroll income.
  await page.getByRole('button', { name: 'Agregar tu último pago' }).click()
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await expect(sheet.getByRole('button', { name: 'Nómina' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(
    sheet.getByRole('button', { name: 'Guardar ingreso' })
  ).toBeVisible()
})

test('a failed load says so instead of showing an empty list', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({ status: 500, json: { message: 'boom' } })
  )
  await login(page)
  await page.goto('/movements')

  await expect(
    page.getByText('No pudimos cargar tus movimientos')
  ).toBeVisible()
  await expect(page.getByText('Todavía no hay movimientos')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Ir al inicio' })
  ).toHaveAttribute('href', /\/dashboard$/)
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('the dashboard says so too when the period fails', async ({ page }) => {
  await page.route('**/api/proxy/read/periods/current*', route =>
    route.fulfill({ status: 500, json: { message: 'boom' } })
  )
  await login(page)
  await expect(
    page.getByText('No pudimos cargar tu período actual')
  ).toBeVisible()
})

test('offline: a thin bar on top and saving is disabled', async ({
  page,
  context
}) => {
  await login(page)
  await context.setOffline(true)
  await expect(
    page.getByText('Sin conexión · los cambios no se pueden guardar')
  ).toBeVisible()

  await page.getByRole('button', { name: 'Agregar movimiento' }).click()
  const sheet = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await sheet.getByLabel('Monto').fill('12')
  await sheet.getByRole('button', { name: 'Necesidad' }).click()
  await expect(
    sheet.getByRole('button', { name: 'Guardar gasto' })
  ).toBeDisabled()

  await context.setOffline(false)
  await expect(
    sheet.getByRole('button', { name: 'Guardar gasto' })
  ).toBeEnabled()
  await expect(
    page.getByText('Sin conexión · los cambios no se pueden guardar')
  ).toHaveCount(0)
})

test('the server error page is human, with retry and home', async ({
  page
}) => {
  await page.goto('/500')
  await expect(
    page.getByRole('heading', { name: 'Algo salió mal de nuestro lado' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible()
})
