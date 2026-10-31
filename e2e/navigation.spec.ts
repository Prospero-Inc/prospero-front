import { expect, type Page, test } from '@playwright/test'

// Wave 4a: phone navigation is a bottom tab bar inside a shell mounted once
// in _app, so moving between screens doesn't remount it.

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

const tabBar = (page: Page) =>
  page.getByRole('navigation', { name: 'Navegación principal' })

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('the tab bar offers the five destinations', async ({ page }) => {
  const bar = tabBar(page)
  await expect(bar).toBeVisible()
  for (const name of ['Inicio', 'Movimientos', 'Fijos', 'Más'])
    await expect(bar.getByRole('link', { name })).toBeVisible()
  await expect(
    bar.getByRole('link', { name: 'Agregar movimiento' })
  ).toBeVisible()
  await expect(bar.getByRole('link', { name: 'Inicio' })).toHaveAttribute(
    'aria-current',
    'page'
  )
})

test('the shell stays mounted while moving between screens', async ({
  page
}) => {
  await tabBar(page).evaluate(element => {
    ;(element as HTMLElement & { marker?: string }).marker = 'same-shell'
  })

  await tabBar(page).getByRole('link', { name: 'Fijos' }).click()
  await page.waitForURL('**/fixed-expenses')
  await tabBar(page).getByRole('link', { name: 'Movimientos' }).click()
  await page.waitForURL('**/expenditures')

  expect(
    await tabBar(page).evaluate(
      element => (element as HTMLElement & { marker?: string }).marker
    )
  ).toBe('same-shell')
  await expect(
    tabBar(page).getByRole('link', { name: 'Movimientos' })
  ).toHaveAttribute('aria-current', 'page')
})

test('"Más" gathers profile, connections and preferences', async ({ page }) => {
  await tabBar(page).getByRole('link', { name: 'Más' }).click()
  await page.waitForURL('**/more')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Más' })
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ana Martínez' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Gmail y bancos' })).toBeVisible()
  await expect(page.getByLabel('Modo oscuro', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Cerrar sesión' })
  ).toBeVisible()
})

test('"+" opens the new expense form', async ({ page }) => {
  await tabBar(page).getByRole('link', { name: 'Agregar movimiento' }).click()

  await expect(page.getByRole('dialog', { name: 'Nuevo gasto' })).toBeVisible()
  await expect(page.getByLabel('Monto')).toBeFocused()
  // The ?new=1 flag is dropped so going back doesn't reopen the form.
  await expect(page).toHaveURL(/\/expenditures$/)
})
