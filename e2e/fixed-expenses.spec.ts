import { expect, type Page, test } from '@playwright/test'

// The server runs in UTC: on an American evening it's already tomorrow, and
// on the last day of the month that showed last month's paid bills as
// unpaid. The front sends the user's local date with the list and "Pagar".

const BACKEND = 'http://localhost:4555'

test.use({ serviceWorkers: 'block' })

const localToday = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const lastRequest = async (page: Page, method: string, path: RegExp) => {
  const requests: {
    method: string
    path: string
    query: Record<string, string>
  }[] = await (await page.request.get(`${BACKEND}/__requests`)).json()
  return requests.filter(r => r.method === method && path.test(r.path)).at(-1)
}

test('lists and pays fixed expenses for the local date', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Sup3r-secret!')
  await page
    .locator('form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click()
  await page.waitForURL('**/dashboard')

  await page.route('**/api/proxy/read/fixed-expenses*', route =>
    route.fulfill({
      json: [
        {
          id: 3,
          name: 'Internet',
          amount: 35,
          dueDate: '2000-01-28',
          budgetCategory: 'Necesidad',
          reminder: false,
          paidThisCycle: false
        }
      ]
    })
  )
  const listRequest = page.waitForRequest(request =>
    request.url().includes('/api/proxy/read/fixed-expenses')
  )
  await page.goto('/fixed-expenses')
  expect(new URL((await listRequest).url()).searchParams.get('today')).toBe(
    localToday()
  )

  await page
    .getByRole('button', { name: 'Marcar como pagado: Internet' })
    .click()
  await expect
    .poll(() => lastRequest(page, 'POST', /^\/api\/fixed-expenses\/3\/pay$/))
    .toMatchObject({ query: { today: localToday() } })
})
