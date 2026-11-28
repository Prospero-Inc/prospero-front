import { expect, type Page, test } from '@playwright/test'

// Dark/light mode: iOS reports both appearances while the installed app
// goes to the background (e.g. pulling down Notification Center), which
// used to flip the app's mode on its own.

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

const chooseAppearance = async (page: Page, option: string) => {
  await page.getByRole('button', { name: /^Apariencia/ }).click()
  await page.getByRole('button', { name: option, exact: true }).click()
}

// The app doesn't follow live changes, it only re-reads the phone's mode
// when it comes back to the foreground.
const backToForeground = (page: Page) =>
  page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

test('a chosen mode is kept when the phone reports the other one', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await login(page)
  await page.goto('/more')
  await chooseAppearance(page, 'Oscuro')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.emulateMedia({ colorScheme: 'light' })
  await backToForeground(page)
  // Absence check: give a (wrong) system-driven flip a moment to land.
  await page.waitForTimeout(300)
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('"Automático" follows the phone when the app comes back', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await login(page)
  await page.goto('/more')
  const appearance = page.getByRole('button', { name: /^Apariencia/ })
  await expect(appearance).toContainText('Automático')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.emulateMedia({ colorScheme: 'dark' })
  await backToForeground(page)
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await chooseAppearance(page, 'Claro')
  await expect(html).toHaveAttribute('data-theme', 'light')
  await chooseAppearance(page, 'Automático')
  await expect(html).toHaveAttribute('data-theme', 'dark')
})
