// Minimal stand-in for prospero-backend used by the Playwright smoke tests:
// just enough auth for NextAuth plus transaction creation. Every other
// endpoint answers 404, which the pages already tolerate as "no data".
// GET /__requests returns what the front sent, so tests can assert on it.
import { createServer } from 'node:http'

const PORT = Number(process.env.FAKE_BACKEND_PORT ?? 4555)
const requests = []

const user = {
  id: 1,
  email: 'ana@example.com',
  username: 'ana',
  firstName: 'Ana',
  lastName: 'Martínez',
  enable2FA: false,
  payFrequency: 'Biweekly',
  needsPercent: 0.5,
  wantsPercent: 0.3,
  savingsPercent: 0.2
}

// Like the real API for a new user: an open period with no income yet
// (the backend never 404s on /periods/current).
const emptyBudget = { budgeted: 0, spent: 0, remaining: 0 }
const emptyCurrentPeriod = {
  key: 'initial',
  startDate: null,
  endDate: null,
  isOpen: true,
  income: 0,
  totalSpent: 0,
  balance: 0,
  budget: { necesidad: emptyBudget, deseo: emptyBudget, ahorro: emptyBudget },
  daysElapsed: null,
  estimatedNextPaymentDate: null,
  estimatedDaysRemaining: null,
  recentTransactions: []
}

const tokens = () => ({
  accessToken: 'fake-access-token',
  accessTokenExpiresIn: 900,
  refreshToken: `fake-refresh-${Date.now()}`,
  user: {
    id: user.id,
    name: 'Ana Martínez',
    email: user.email,
    username: 'ana'
  }
})

const routes = {
  'POST /api/auth/login': () => [201, tokens()],
  'POST /api/auth/refresh': () => [201, tokens()],
  'POST /api/auth/logout': () => [200, {}],
  'GET /api/auth/profile': () => [200, { msg: 'Profile', user }],
  'POST /api/transactions': body => [201, { id: requests.length, ...body }],
  'POST /api/salary': body => [201, { id: requests.length, ...body }],
  // Screens load these with SWR: a new user with no data yet.
  'GET /api/periods/current': () => [200, emptyCurrentPeriod],
  'GET /api/periods': () => [200, []],
  'GET /api/periods/transactions': () => [200, []],
  'GET /api/periods/salary': () => [200, []],
  'GET /api/transactions': () => [200, []],
  'GET /api/salary': () => [200, []],
  'GET /api/fixed-expenses': () => [200, []],
  'GET /api/review-queue/summary': () => [
    200,
    { pendingTransactions: 0, pendingSalaries: 0 }
  ]
}

const readBody = req =>
  new Promise(resolve => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : undefined)
      } catch {
        resolve(raw)
      }
    })
  })

createServer(async (req, res) => {
  const path = req.url.split('?')[0]
  res.setHeader('content-type', 'application/json')

  if (path === '/__requests') return res.end(JSON.stringify(requests))

  const body = await readBody(req)
  requests.push({ method: req.method, path, body, headers: req.headers })

  // Review queue confirmations: PATCH /api/transactions/:id, /api/salary/:id
  const isPatchById =
    req.method === 'PATCH' && /^\/api\/(transactions|salary)\/\d+$/.test(path)
  const handler = isPatchById
    ? patchBody => [200, { id: Number(path.split('/').pop()), ...patchBody }]
    : routes[`${req.method} ${path}`]
  const [status, payload] = handler
    ? handler(body)
    : [404, { message: 'Not found (fake backend)' }]
  res.statusCode = status
  res.end(JSON.stringify(payload))
}).listen(PORT, () => console.log(`fake backend on :${PORT}`))
