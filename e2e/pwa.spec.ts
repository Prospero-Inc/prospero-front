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
