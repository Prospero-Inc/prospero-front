import { expect, type Page, test } from '@playwright/test'

// Edición de movimientos: tapping (or swiping) a row of /movements opens the
// "Nuevo movimiento" sheet in edit mode, which sends only what changed
// (PATCH /transactions/:id, /salary/:id) and can delete the movement.

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

const expense = {
  id: 11,
  amount: 12.5,
  date: '2026-10-30T00:00:00.000Z',
  category: 'Necesidad',
  description: 'Súper Selectos',
  source: 'Manual',
  reviewStatus: 'Confirmed',
  fixedExpenseName: null,
  institutionName: null,
  possibleGmailDuplicate: null,
  periodOverride: null
}

const income = {
  id: 21,
  amount: 40,
  date: '2026-10-29T00:00:00.000Z',
  type: 'Extra',
  status: 'Classified',
  incomeCategory: 'Extra',
  description: 'Venta de artesanías',
  source: 'Manual',
  institutionName: null,
  possibleGmailDuplicate: null,
  budgetCategory: null,
  distributeAutomatically: false
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({ json: [expense] })
  )
  await page.route('**/api/proxy/read/periods/salary*', route =>
    route.fulfill({ json: [income] })
  )
  await login(page)
  await page.goto('/movements')
})

const sheet = (page: Page, name: string) => page.getByRole('dialog', { name })

test('tapping an expense opens it filled in; only the changes are sent', async ({
  page
}) => {
  await page.getByRole('button', { name: 'Editar Súper Selectos' }).click()

  const edit = sheet(page, 'Editar gasto')
  await expect(edit.getByLabel('Monto')).toHaveValue('12.50')
  await expect(edit.getByRole('button', { name: 'Necesidad' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  // An expense can't become an income.
  await expect(
    edit.getByRole('group', { name: 'Tipo de movimiento' })
  ).toHaveCount(0)

  await edit.getByLabel('Monto').fill('15')
  await edit.getByRole('button', { name: 'Deseo' }).click()
  await edit.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/transactions/11'))
    .toMatchObject({ body: { amount: 15, category: 'Deseo' } })
  expect(
    (await lastRequest(page, 'PATCH', '/api/transactions/11'))?.body
  ).toEqual({ amount: 15, category: 'Deseo' })
  await expect(edit).toBeHidden()
})

test('an expense can be forced into the previous period', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar Súper Selectos' }).click()
  const edit = sheet(page, 'Editar gasto')
  // The note is filled in, so "Más opciones" is already open.
  await edit.getByRole('button', { name: 'Período anterior' }).click()
  await edit.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/transactions/11'))
    .toMatchObject({ body: { periodOverride: 'Previous' } })
})

test('swiping a row to the left opens the same sheet', async ({ page }) => {
  const row = page.getByRole('button', { name: 'Editar Súper Selectos' })
  const box = await row.boundingBox()
  if (!box) throw new Error('row not visible')
  const y = box.y + box.height / 2
  const startX = box.x + box.width - 20
  // A finger dragging left, as pointer events (works the same on every
  // emulated device).
  const pointer = (type: string, x: number) =>
    row.dispatchEvent(type, {
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
      bubbles: true
    })
  await pointer('pointerdown', startX)
  for (const dx of [12, 30, 60, 90, 120])
    await pointer('pointermove', startX - dx)
  await pointer('pointerup', startX - 120)

  await expect(sheet(page, 'Editar gasto')).toBeVisible()
})

test('an Extra income: destination and type', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar Venta de artesanías' }).click()

  const edit = sheet(page, 'Editar ingreso')
  await expect(edit.getByLabel('Monto')).toHaveValue('40')
  await edit.getByRole('button', { name: 'Repartir' }).click()
  await edit.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/salary/21'))
    .toMatchObject({
      body: { distributeAutomatically: true, budgetCategory: null }
    })
})

test('turning an Extra into payroll sends no budget fields', async ({
  page
}) => {
  await page.getByRole('button', { name: 'Editar Venta de artesanías' }).click()
  const edit = sheet(page, 'Editar ingreso')
  await edit.getByRole('button', { name: 'Nómina' }).click()
  await edit.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/salary/21'))
    .toMatchObject({ body: { type: 'Payroll' } })
  const body = (await lastRequest(page, 'PATCH', '/api/salary/21'))
    ?.body as Record<string, unknown>
  expect(body).not.toHaveProperty('budgetCategory')
  expect(body).not.toHaveProperty('distributeAutomatically')
})

test('deleting asks in the design sheet, then removes the row', async ({
  page
}) => {
  await page.getByRole('button', { name: 'Editar Súper Selectos' }).click()
  await sheet(page, 'Editar gasto')
    .getByRole('button', { name: 'Eliminar gasto' })
    .click()

  const confirm = sheet(page, '¿Eliminar "Súper Selectos"?')
  await expect(confirm).toBeVisible()
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await confirm.getByRole('button', { name: 'Eliminar gasto' }).click()

  await expect
    .poll(() => lastRequest(page, 'DELETE', '/api/transactions/11'))
    .toBeTruthy()
})

test('an income can be deleted too', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar Venta de artesanías' }).click()
  await sheet(page, 'Editar ingreso')
    .getByRole('button', { name: 'Eliminar ingreso' })
    .click()
  await sheet(page, '¿Eliminar "Venta de artesanías"?')
    .getByRole('button', { name: 'Eliminar ingreso' })
    .click()

  await expect
    .poll(() => lastRequest(page, 'DELETE', '/api/salary/21'))
    .toBeTruthy()
})

test('"+" still opens an empty "Nuevo movimiento"', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar Súper Selectos' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Agregar movimiento' }).click()

  const create = sheet(page, 'Nuevo movimiento')
  await expect(create.getByLabel('Monto')).toHaveValue('')
  await expect(
    create.getByRole('group', { name: 'Tipo de movimiento' })
  ).toBeVisible()
})
