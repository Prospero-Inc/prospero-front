import { expect, type Locator, type Page, test } from '@playwright/test'

// Configuración dividida (docs/diseno-mobile.html, 06–09): each row of
// "Más" opens its own screen under /settings/*, with "‹ Más" and no tab bar.

const BACKEND = 'http://localhost:4555'

// page.route() can't see requests the service worker makes.
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

const lastRequest = async (page: Page, method: string, path: string) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === method && r.path === path).at(-1)
}

const tabBar = (page: Page) =>
  page.getByRole('navigation', { name: 'Navegación principal' })

/** Types a 6-digit code box by box (typing in one go races with the boxes
 * moving focus by themselves when the machine is slow). */
const enterCode = async (scope: Page | Locator, code: string) => {
  for (let index = 0; index < code.length; index++) {
    const digit = code.charAt(index)
    const box = scope.getByLabel(`Dígito ${index + 1} del código`)
    await expect(box).toBeEnabled()
    await box.fill(digit)
  }
}

const heading = (page: Page, name: string) =>
  page.getByRole('heading', { level: 1, name })

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('each row of "Más" opens its own screen', async ({ page }) => {
  const screens = [
    { row: 'Ana Martínez', url: '/settings/profile', title: 'Perfil' },
    { row: /^Presupuesto/, url: '/settings/budget', title: 'Presupuesto' },
    { row: /^Gmail y bancos/, url: '/settings/gmail', title: 'Gmail y bancos' },
    {
      row: 'Notificaciones',
      url: '/settings/notifications',
      title: 'Notificaciones'
    },
    { row: /^Seguridad y 2FA/, url: '/settings/security', title: 'Seguridad' }
  ]
  for (const screen of screens) {
    await page.goto('/more')
    await page.getByRole('link', { name: screen.row }).click()
    await page.waitForURL(`**${screen.url}`)
    await expect(heading(page, screen.title)).toBeVisible()
    await expect(tabBar(page)).toBeHidden()
  }

  await page.getByRole('link', { name: 'Más' }).click()
  await page.waitForURL('**/more')
  await expect(tabBar(page)).toBeVisible()
})

test('old links land on the new screens', async ({ page }) => {
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/more$/)

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/settings\/profile$/)

  await page.goto('/profile/2fa')
  await expect(page).toHaveURL(/\/settings\/security\/2fa$/)

  // Google's consent screen used to come back to /settings?gmail=…
  await page.goto('/settings?gmail=connected')
  await expect(page.getByText('Gmail conectado')).toBeVisible()
  // Said once: the query is cleaned so a reload doesn't repeat it.
  await expect(page).toHaveURL(/\/settings\/gmail$/)
})

test('profile: "Guardar" appears only after a change', async ({ page }) => {
  await page.goto('/settings/profile')
  await expect(page.getByText('Miembro desde marzo de 2026')).toBeVisible()
  const save = page.getByRole('button', { name: 'Guardar' })
  await expect(save).toBeHidden()

  await page.getByLabel('Nombre', { exact: true }).fill('Anita')
  await expect(save).toBeVisible()
  await save.click()

  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/auth/profile'))
    .toMatchObject({ body: { firstName: 'Anita' } })
  expect((await lastRequest(page, 'PATCH', '/api/auth/profile'))?.body).toEqual(
    { firstName: 'Anita' }
  )
})

test('budget: saving waits until the split adds up to 100 %', async ({
  page
}) => {
  await page.goto('/settings/budget')
  const save = page.getByRole('button', { name: 'Guardar presupuesto' })
  await expect(page.getByText('100 %')).toBeVisible()

  await page.getByRole('button', { name: 'Mensual' }).click()
  await page.getByRole('button', { name: 'Subir Necesidades' }).click()
  await expect(page.getByText('105 % · sobran 5 %')).toBeVisible()
  await expect(save).toBeDisabled()

  await page.getByRole('button', { name: 'Bajar Deseos' }).click()
  await expect(page.getByText('100 %')).toBeVisible()
  await save.click()

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

  await page.getByRole('button', { name: 'Volver a 50 / 30 / 20' }).click()
  await expect(page.getByText('50%')).toBeVisible()
})

test('gmail: connection, toggles and adding a bank', async ({ page }) => {
  await page.goto('/settings/gmail')
  await expect(page.getByText('Conectado', { exact: true })).toBeVisible()
  await expect(page.getByText('notificacion@baccredomatic.com')).toBeVisible()

  const detect = page.getByRole('switch', { name: 'Detectar movimientos' })
  await expect(detect).toHaveAttribute('aria-checked', 'true')
  await detect.click()
  await expect(detect).toHaveAttribute('aria-checked', 'false')
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/gmail/connection'))
    .toMatchObject({ body: { autoDetectEnabled: false } })

  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Agregar banco' })
  // BAC is already there; Agrícola can be added.
  await expect(
    sheet.getByRole('button', { name: /BAC Credomatic/ })
  ).toBeDisabled()
  await sheet.getByRole('button', { name: /Banco Agrícola/ }).click()
  await expect(sheet.getByLabel('Nombre del banco')).toHaveValue(
    'Banco Agrícola'
  )
  await sheet
    .getByLabel('Correo que envía los avisos')
    .fill('avisos@bancoagricola.com')
  await sheet.getByRole('button', { name: 'Agregar banco' }).click()

  await expect
    .poll(() => lastRequest(page, 'POST', '/api/financial-institutions'))
    .toMatchObject({
      body: {
        name: 'Banco Agrícola',
        parserKey: 'agricola',
        senders: ['avisos@bancoagricola.com']
      }
    })
  await expect(sheet).toBeHidden()
})

test('gmail: another bank warns that it stays manual', async ({ page }) => {
  await page.goto('/settings/gmail')
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Agregar banco' })
  await sheet.getByRole('button', { name: 'Otro banco' }).click()
  await expect(
    sheet.getByText('sus movimientos los registrás a mano')
  ).toBeVisible()
})

test('notifications: email is the fallback switch', async ({ page }) => {
  await page.goto('/settings/notifications')
  const email = page.getByRole('switch', { name: 'Avisarme por correo' })
  await expect(email).toHaveAttribute('aria-checked', 'false')
  await email.click()
  await expect(email).toHaveAttribute('aria-checked', 'true')
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/notifications/preferences'))
    .toMatchObject({ body: { gmailReviewEmailEnabled: true } })
  await expect(
    page.getByRole('switch', { name: 'Movimientos por revisar' })
  ).toHaveAttribute('aria-checked', 'true')
})

test('security: turning 2FA off asks for the code in a sheet', async ({
  page
}) => {
  // This account has 2FA on.
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
          enable2FA: true,
          isGoogleAccount: false,
          createdAt: '2026-03-14T12:00:00.000Z',
          payFrequency: 'Biweekly',
          needsPercent: 0.5,
          wantsPercent: 0.3,
          savingsPercent: 0.2
        }
      }
    })
  )
  await page.goto('/settings/security')
  await expect(page.getByText('Activada', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Desactivar' }).click()

  const sheet = page.getByRole('dialog', {
    name: 'Desactivar la verificación'
  })
  await enterCode(sheet, '000000')
  await expect(sheet.getByRole('alert')).toBeVisible()

  await enterCode(sheet, '123456')
  await expect
    .poll(() => lastRequest(page, 'POST', '/api/auth/disable-2fa'))
    .toMatchObject({ body: { token: '123456' } })
  await expect(sheet).toBeHidden()
})

test('security: changing the password sends the reset email', async ({
  page
}) => {
  await page.goto('/settings/security')
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await page.getByRole('button', { name: 'Mandar enlace' }).click()
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/auth/request-reset-password'))
    .toMatchObject({ body: { email: 'ana@example.com' } })
  await expect(page.getByText('Revisá tu correo')).toBeVisible()
})

test('security: signing out of every device', async ({ page }) => {
  await page.goto('/settings/security')
  await page
    .getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' })
    .click()
  await page.getByRole('button', { name: 'Cerrar sesión en todos' }).click()
  await page.waitForURL('**/auth/login')
  expect(await lastRequest(page, 'POST', '/api/auth/logout-all')).toBeTruthy()
})

test('2FA setup: open the app or copy the key, then the first code', async ({
  page
}) => {
  await page.goto('/settings/security')
  await page.getByRole('link', { name: 'Activar' }).click()
  await page.waitForURL('**/settings/security/2fa')

  await expect(
    page.getByRole('link', { name: 'Abrir app de autenticación' })
  ).toHaveAttribute('href', /^otpauth:\/\/totp\//)
  await expect(page.getByText('JBSW Y3DP EHPK 3PXP')).toBeVisible()
  await expect(
    page.getByRole('img', {
      name: 'Código QR para vincular tu app de autenticación'
    })
  ).toBeVisible()

  await page.getByRole('button', { name: 'Ya la agregué, continuar' }).click()
  await expect(page).toHaveURL(/step=2/)
  await expect(page.getByRole('link', { name: 'Atrás' })).toBeVisible()

  await enterCode(page, '000000')
  await expect(page.getByText(/El código no es correcto/)).toBeVisible()

  await enterCode(page, '123456')
  await page.waitForURL(/\/settings\/security$/)
  await expect
    .poll(() => lastRequest(page, 'POST', '/api/auth/validate-2fa'))
    .toMatchObject({ body: { token: '123456' } })
})

test("gmail: a bank's reader can be changed from its sheet", async ({
  page
}) => {
  await page.goto('/settings/gmail')
  await page.getByRole('button', { name: /BAC Credomatic/ }).click()
  const sheet = page.getByRole('dialog', { name: 'BAC Credomatic' })
  await expect(
    sheet.getByRole('button', { name: /BAC Credomatic/ })
  ).toHaveAttribute('aria-pressed', 'true')
  await sheet.getByRole('button', { name: 'Ninguno (solo manual)' }).click()
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/financial-institutions/7'))
    .toMatchObject({ body: { parserKey: null } })
})

test('settings screens follow the mobile rules', async ({ page }) => {
  for (const path of [
    '/settings/profile',
    '/settings/budget',
    '/settings/security/2fa',
    '/settings/gmail',
    '/settings/notifications',
    '/settings/security'
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const fontSizes = await page
      .locator('input:visible')
      .evaluateAll(fields =>
        fields.map(field => parseFloat(getComputedStyle(field).fontSize))
      )
    for (const size of fontSizes) expect(size).toBeGreaterThanOrEqual(16)

    const buttons = await page.locator('button:visible').evaluateAll(elements =>
      elements.map(element => ({
        label:
          element.textContent?.trim() || element.getAttribute('aria-label'),
        height: element.getBoundingClientRect().height
      }))
    )
    for (const button of buttons)
      expect(button.height, `${path}: ${button.label}`).toBeGreaterThanOrEqual(
        44
      )

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
