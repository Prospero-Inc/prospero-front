import { expect, test } from '@playwright/test'

// F4: "Hoy"/"Ayer" follow the phone's local day. At 20:00 in El Salvador
// (UTC-6) it is already tomorrow in UTC, which used to turn today's
// movements into "Ayer".

// page.route can't see requests the service worker handles.
test.use({ serviceWorkers: 'block', timezoneId: 'America/El_Salvador' })

const movement = (id: number, description: string, date: string) => ({
  id,
  amount: 5,
  date,
  category: 'Necesidad',
  description,
  source: 'Manual',
  reviewStatus: 'Confirmed',
  fixedExpenseName: null,
  institutionName: null,
  possibleGmailDuplicate: null,
  periodOverride: null
})

test('labels today and yesterday by the local day at night', async ({
  page
}) => {
  await page.route('**/api/proxy/read/periods/transactions*', route =>
    route.fulfill({
      json: [
        movement(1, 'Cena', '2026-11-24T00:00:00.000Z'),
        movement(2, 'Almuerzo', '2026-11-23T00:00:00.000Z'),
        movement(3, 'Café', '2026-11-22T00:00:00.000Z')
      ]
    })
  )
  await page.route('**/api/proxy/read/periods/salary*', route =>
    route.fulfill({ json: [] })
  )

  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
  await page
    .locator('form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click()
  await page.waitForURL('**/dashboard')

  // Tuesday 24 Nov 2026, 20:00 in El Salvador = 02:00 UTC on the 25th.
  await page.clock.setFixedTime(new Date('2026-11-25T02:00:00.000Z'))
  await page.goto('/movements')

  const headings = page.getByRole('heading', { level: 2 })
  await expect(headings.filter({ hasText: /^Hoy$/ })).toHaveCount(1)
  await expect(headings.filter({ hasText: /^Ayer$/ })).toHaveCount(1)
  await expect(headings.filter({ hasText: /domingo 22/i })).toHaveCount(1)
})
