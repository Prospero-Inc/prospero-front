import { expect, type Page, test } from '@playwright/test'

// The service worker (src/sw.ts, built by Serwist into /sw.js — the URL
// existing push subscriptions are bound to) and its offline fallback.

const activeServiceWorker = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return registration.active?.scriptURL ?? null
  })

test('registers the service worker at /sw.js', async ({ page }) => {
  await page.goto('/auth/login')

  expect(await activeServiceWorker(page)).toMatch(/\/sw\.js$/)
})

test('shows the offline page when a screen cannot load', async ({
  page,
  context
}) => {
  await page.goto('/auth/login')
  await activeServiceWorker(page)
  // Let the new worker take control of this page (clientsClaim).
  await page.reload()

  await context.setOffline(true)
  await page.goto('/auth/register').catch(() => undefined)

  await expect(
    page.getByRole('heading', { name: 'Sin conexión' })
  ).toBeVisible()
  await context.setOffline(false)
})

test('precaches the icons, the manifest and the favicon', async ({ page }) => {
  await page.goto('/auth/login')
  await activeServiceWorker(page)

  const missing = await page.evaluate(async () => {
    const urls = [
      '/manifest.json',
      '/favicon.ico',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-192.png',
      '/icons/icon-maskable-512.png',
      '/icons/apple-touch-icon.png'
    ]
    // Precache entries carry a ?__WB_REVISION__ query.
    const cached = await Promise.all(
      urls.map(url => caches.match(url, { ignoreSearch: true }))
    )
    return urls.filter((_, index) => !cached[index])
  })
  expect(missing).toEqual([])
})

test('changing the language does not register the service worker again', async ({
  page
}) => {
  await page.addInitScript(() => {
    const register = ServiceWorkerContainer.prototype.register
    const counted = window as unknown as { swRegistrations: number }
    counted.swRegistrations = 0
    ServiceWorkerContainer.prototype.register = function (...args) {
      counted.swRegistrations += 1
      return register.apply(this, args)
    }
  })
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
  await page
    .locator('form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click()
  await page.waitForURL('**/dashboard')
  await page.goto('/more')
  const registrations = () =>
    page.evaluate(
      () => (window as unknown as { swRegistrations: number }).swRegistrations
    )
  await expect.poll(registrations).toBe(1)

  await page.getByRole('button', { name: /Idioma/ }).click()
  await page.getByRole('button', { name: /English/ }).click()
  await page.waitForURL('**/en/more')
  await expect(page.getByRole('button', { name: /Language/ })).toBeVisible()

  expect(await registrations()).toBe(1)
})
