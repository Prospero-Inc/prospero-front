import { expect, type Page, test } from '@playwright/test'

// "Nuevo gasto fijo" / "Editar gasto fijo" drawn like "Nuevo movimiento":
// big amount, name, category buttons, due day row, "Recordarme" switch,
// note under "Más opciones", and the design's delete sheet.

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

const lastRequest = async (page: Page, method: string, path: string) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === method && r.path === path).at(-1)
}

const gym = {
  id: 5,
  name: 'Gimnasio',
  amount: 55,
  dueDate: '2000-01-12',
  budgetCategory: 'Deseo',
  reminder: false,
  description: '',
  paidThisCycle: false
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/proxy/read/fixed-expenses*', route =>
    route.fulfill({ json: [gym] })
  )
  await login(page)
  await page.goto('/fixed-expenses')
})

test('creates a fixed expense from the new sheet', async ({ page }) => {
  await page.getByRole('button', { name: 'Nuevo gasto fijo' }).click()
  const sheet = page.getByRole('dialog', { name: 'Nuevo gasto fijo' })
  const save = sheet.getByRole('button', { name: 'Guardar gasto fijo' })
  await expect(save).toBeDisabled()

  await sheet.getByLabel('Monto').fill('35,50')
  await sheet.getByLabel('Nombre').fill('Internet')
  await sheet.getByRole('button', { name: 'Necesidad' }).click()
  await sheet.getByLabel('Vence').selectOption('28')
  await expect(sheet.getByText('Día 28 de cada mes')).toBeVisible()
  await sheet.getByRole('switch', { name: 'Recordarme' }).click()
  await save.click()

  await expect
    .poll(() => lastRequest(page, 'POST', '/api/fixed-expenses'))
    .toMatchObject({
      body: {
        amount: 35.5,
        name: 'Internet',
        budgetCategory: 'Necesidad',
        reminder: true
      }
    })
  await expect(sheet).toBeHidden()
})

test('edits one: the sheet opens filled in', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar: Gimnasio' }).click()
  const sheet = page.getByRole('dialog', { name: 'Editar gasto fijo' })
  await expect(sheet.getByLabel('Monto')).toHaveValue('55')
  await expect(sheet.getByLabel('Nombre')).toHaveValue('Gimnasio')
  await expect(sheet.getByRole('button', { name: 'Deseo' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(sheet.getByText('Día 12 de cada mes')).toBeVisible()

  await sheet.getByLabel('Monto').fill('60')
  await sheet.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/fixed-expenses/5'))
    .toMatchObject({ body: { amount: 60, name: 'Gimnasio' } })
})

test('deleting asks with the design sheet', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar: Gimnasio' }).click()
  await page
    .getByRole('dialog', { name: 'Editar gasto fijo' })
    .getByRole('button', { name: 'Eliminar gasto fijo' })
    .click()

  const confirm = page.getByRole('dialog', { name: '¿Eliminar "Gimnasio"?' })
  await expect(
    confirm.getByText(
      'Deja de aparecer en tus gastos fijos. Los pagos que ya registraste se mantienen en Movimientos.'
    )
  ).toBeVisible()
  await confirm.getByRole('button', { name: 'Eliminar gasto fijo' }).click()

  await expect
    .poll(() => lastRequest(page, 'DELETE', '/api/fixed-expenses/5'))
    .toBeTruthy()
})
