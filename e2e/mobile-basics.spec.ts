import { expect, type Page, test } from '@playwright/test'

// Mobile wave 1 rules (docs/plan-remediacion.md, "Pista paralela"): one
// 16 px gutter, fields that don't trigger iOS zoom, thumb-sized buttons,
// keyboards and autofill that match each field.

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

/** Font size (px) of every visible input, select and textarea. */
const fieldFontSizes = (page: Page) =>
  page
    .locator('input:visible, select:visible, textarea:visible')
    .evaluateAll(fields =>
      fields.map(field => parseFloat(getComputedStyle(field).fontSize))
    )

/** Height (px) of every visible button. */
const buttonHeights = (page: Page) =>
  page.locator('button:visible').evaluateAll(buttons =>
    buttons.map(button => ({
      label: button.textContent?.trim() || button.getAttribute('aria-label'),
      height: button.getBoundingClientRect().height
    }))
  )

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('fields are at least 16 px so iOS does not zoom', async ({ page }) => {
    for (const size of await fieldFontSizes(page))
      expect(size).toBeGreaterThanOrEqual(16)
  })

  test('email and password fields help the keyboard and password manager', async ({
    page
  }) => {
    const email = page.getByLabel('Correo electrónico')
    await expect(email).toHaveAttribute('type', 'email')
    await expect(email).toHaveAttribute('autocomplete', 'email')
    await expect(
      page.getByLabel('Contraseña', { exact: true })
    ).toHaveAttribute('autocomplete', 'current-password')
  })

  test('does not download the desktop illustrations', async ({ page }) => {
    const illustrations: string[] = []
    page.on('request', request => {
      if (/Saly-\d\.svg/.test(request.url())) illustrations.push(request.url())
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(illustrations).toEqual([])
  })

  test('document language follows the active locale', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })
})

test.describe('signed-in pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/expenditures')
  })

  test('content uses a single 16 px side gutter', async ({ page }) => {
    const box = await page
      .getByRole('heading', { level: 2 })
      .first()
      .boundingBox()
    expect(box?.x).toBe(16)
  })

  test('buttons are at least 44 px tall', async ({ page }) => {
    const tooSmall = (await buttonHeights(page)).filter(
      ({ height }) => height < 44
    )
    expect(tooSmall).toEqual([])
  })

  test('the amount field opens empty, with a decimal keyboard', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'Nuevo gasto' }).click()
    const amount = page.getByLabel('Monto')
    await expect(amount).toHaveValue('')
    await expect(amount).toHaveAttribute('inputmode', 'decimal')
    for (const size of await fieldFontSizes(page))
      expect(size).toBeGreaterThanOrEqual(16)
  })
})

test('the installed app opens on the dashboard', async ({ request }) => {
  const manifest = await (await request.get('/manifest.json')).json()
  expect(manifest).toMatchObject({
    start_url: '/dashboard',
    scope: '/',
    lang: 'es'
  })
})

test.describe('before JavaScript takes over', () => {
  // A slow phone can show the server-rendered form before React hydrates;
  // submitting then is a plain HTML form submit. It must never be a GET,
  // which would put the password in the URL, history and server logs.
  test.use({ javaScriptEnabled: false })

  test('submitting the login form does not put the password in the URL', async ({
    page
  }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Correo electrónico').fill('ana@example.com')
    await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
    await page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión' })
      .click()
    await page.waitForLoadState()

    expect(page.url()).not.toContain('Sup3r-secret')
    expect(page.url()).not.toContain('password')
  })
})
