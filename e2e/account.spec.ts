import { expect, type Page, test } from '@playwright/test'

// Cuenta (docs/diseno-mobile.html, 11–12): registro, "Revisá tu correo",
// código 2FA del login, olvidé mi contraseña y restablecer.

// page.route can't see requests the service worker handles.
test.use({ serviceWorkers: 'block' })

const BACKEND = 'http://localhost:4555'

const lastRequest = async (page: Page, method: string, path: string) => {
  const requests: { method: string; path: string; body: unknown }[] = await (
    await page.request.get(`${BACKEND}/__requests`)
  ).json()
  return requests.filter(r => r.method === method && r.path === path).at(-1)
}

/** A pre-auth token whose `exp` is `seconds` from now (unsigned: the
 * screen only reads it for the countdown). */
const preAuthToken = (seconds: number) => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    typ: 'pre_auth',
    exp: Math.floor(Date.now() / 1000) + seconds
  })}.signature`
}

/** Types a 6-digit code box by box. */
const enterCode = async (page: Page, code: string) => {
  for (let index = 0; index < code.length; index++) {
    const box = page.getByLabel(`Dígito ${index + 1} del código`)
    await expect(box).toBeEnabled()
    await box.fill(code.charAt(index))
  }
}

test.describe('register', () => {
  test('password rules tick as you type, then "Revisá tu correo"', async ({
    page
  }) => {
    await page.goto('/auth/register')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Creá tu cuenta' })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible()

    await page.getByLabel('Nombre', { exact: true }).fill('Ana')
    await page.getByLabel('Apellido').fill('Martínez')
    await page.getByLabel('Correo electrónico').fill('ana.martinez@gmail.com')
    await page.getByLabel('Nombre de usuario').fill('anamtz')
    const password = page.getByLabel('Contraseña')
    await expect(password).toHaveAttribute('autocomplete', 'new-password')

    await password.fill('abcdefgh')
    await expect(page.getByText('8 caracteres (cumplido)')).toBeVisible()
    await expect(page.getByText('Minúscula (cumplido)')).toBeVisible()
    await expect(page.getByText('Mayúscula (cumplido)')).toHaveCount(0)

    // Not all rules met: nothing is sent.
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(
      page.getByText('La contraseña todavía no cumple todos los requisitos')
    ).toBeVisible()

    await password.fill('Abcdefg1!')
    await page.getByRole('button', { name: 'Mostrar' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect
      .poll(() => lastRequest(page, 'POST', '/api/auth/signup'))
      .toMatchObject({
        body: {
          firstName: 'Ana',
          lastName: 'Martínez',
          email: 'ana.martinez@gmail.com',
          usernName: 'anamtz'
        }
      })

    await page.waitForURL('**/auth/verify-account?**')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Revisá tu correo' })
    ).toBeVisible()
    await expect(page.getByText('ana.martinez@gmail.com')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Abrir Gmail' })
    ).toHaveAttribute('href', 'https://mail.google.com/')
    // Just sent: resending waits for the countdown.
    await expect(
      page.getByRole('button', { name: 'Reenviar correo' })
    ).toBeDisabled()
    await expect(
      page.getByText(/Podés reenviarlo de nuevo en 0:4\d/)
    ).toBeVisible()
  })
})

test('"Revisá tu correo" from the login of an inactive account can resend', async ({
  page
}) => {
  await page.goto('/auth/verify-account?email=ana%40empresa.com')
  // Unknown provider: no "Abrir …" button.
  await expect(page.getByRole('link', { name: /^Abrir / })).toHaveCount(0)
  await page.getByRole('button', { name: 'Reenviar correo' }).click()
  await expect
    .poll(() => lastRequest(page, 'POST', '/api/auth/resend-verification'))
    .toMatchObject({ body: { email: 'ana@empresa.com' } })
  await expect(
    page.getByRole('button', { name: 'Reenviar correo' })
  ).toBeDisabled()
})

test.describe('2FA code at login', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/proxy/login', route =>
      route.fulfill({
        json: { requires2FA: true, preAuthToken: preAuthToken(252) }
      })
    )
    await page.goto('/auth/login')
    await page.getByLabel('Correo electrónico').fill('ana@example.com')
    await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
    await page
      .locator('form')
      .getByRole('button', { name: 'Iniciar sesión' })
      .click()
    await page.waitForURL('**/auth/verify-2fa')
  })

  test('six boxes, a countdown, and in with the sixth digit', async ({
    page
  }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Verificación en dos pasos' })
    ).toBeVisible()
    await expect(
      page.getByText(/Por seguridad, este paso vence en 4:\d\d/)
    ).toBeVisible()
    await expect(page.getByLabel('Dígito 1 del código')).toHaveAttribute(
      'autocomplete',
      'one-time-code'
    )

    await enterCode(page, '000000')
    await expect(page.getByText(/El código no es correcto/)).toBeVisible()

    await enterCode(page, '123456')
    await page.waitForURL('**/dashboard')
  })

  test('"¿Perdiste el acceso a tu app?" explains the saved key', async ({
    page
  }) => {
    await page
      .getByRole('button', { name: '¿Perdiste el acceso a tu app?' })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Perdí el acceso a mi app' })
    ).toBeVisible()
  })
})

test('an expired 2FA step sends back to the login', async ({ page }) => {
  await page.goto('/auth/login')
  await page.evaluate(
    token => sessionStorage.setItem('prospero:preAuthToken', token),
    preAuthToken(-5)
  )
  await page.goto('/auth/verify-2fa')
  await expect(page.getByText(/Este paso venció por seguridad/)).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar sesión de nuevo' }).click()
  await page.waitForURL('**/auth/login')
})

test('forgot password answers in place', async ({ page }) => {
  await page.goto('/auth/forgot-password')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByRole('button', { name: 'Enviar enlace' }).click()
  await expect(page.getByText('Listo, revisá tu correo')).toBeVisible()
  await expect
    .poll(() => lastRequest(page, 'PATCH', '/api/auth/request-reset-password'))
    .toMatchObject({ body: { email: 'ana@example.com' } })
  await expect(page).toHaveURL(/\/auth\/forgot-password$/)
})

test.describe('reset password from the emailed link', () => {
  test('rules plus "Coinciden", then sign in', async ({ page }) => {
    await page.goto('/auth/reset-password/0f5c3b1e-1111-4a2b-9c3d-123456789abc')
    await page.getByLabel('Nueva').fill('Abcdefg1!')
    await page.getByLabel('Repetir').fill('Abcdefg1')
    await expect(page.getByText('Coinciden (cumplido)')).toHaveCount(0)
    await page.getByLabel('Repetir').fill('Abcdefg1!')
    await expect(page.getByText('Coinciden (cumplido)')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()

    await expect(
      page.getByRole('heading', { name: 'Contraseña actualizada' })
    ).toBeVisible()
    await expect
      .poll(() =>
        lastRequest(
          page,
          'POST',
          '/api/auth/reset-password/0f5c3b1e-1111-4a2b-9c3d-123456789abc'
        )
      )
      .toMatchObject({
        body: { password: 'Abcdefg1!', confirmPassword: 'Abcdefg1!' }
      })
    await page.getByRole('link', { name: 'Iniciar sesión' }).click()
    await page.waitForURL('**/auth/login')
  })

  test('a spent link offers a new one', async ({ page }) => {
    await page.goto('/auth/reset-password/used')
    await page.getByLabel('Nueva').fill('Abcdefg1!')
    await page.getByLabel('Repetir').fill('Abcdefg1!')
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()
    await expect(
      page.getByRole('heading', { name: 'El enlace venció o ya se usó' })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Pedir otro enlace' })
    ).toHaveAttribute('href', /\/auth\/forgot-password$/)
  })
})
