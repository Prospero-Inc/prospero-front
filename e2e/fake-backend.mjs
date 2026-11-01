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
  isGoogleAccount: false,
  createdAt: '2026-03-14T12:00:00.000Z',
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
  'PATCH /api/auth/profile': body => [
    200,
    { msg: 'Profile', user: { ...user, ...body } }
  ],
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
  'POST /api/fixed-expenses': body => [201, { id: requests.length, ...body }],
  'GET /api/review-queue/summary': () => [
    200,
    { pendingTransactions: 0, pendingSalaries: 0 }
  ],
  // Settings screens: Gmail connected, one bank we read, default prefs.
  'GET /api/gmail/connection': () => [
    200,
    {
      connected: true,
      status: 'Connected',
      lastSyncAt: '2026-10-31T18:00:00.000Z',
      autoDetectEnabled: true,
      notifyIncomeEnabled: true
    }
  ],
  'PATCH /api/gmail/connection': body => [200, body],
  'GET /api/financial-institutions': () => [
    200,
    [
      {
        id: 7,
        userId: 1,
        name: 'BAC Credomatic',
        isActive: true,
        parserKey: 'bac',
        senders: [
          {
            id: 70,
            institutionId: 7,
            emailAddress: 'notificacion@baccredomatic.com',
            createdAt: '2026-10-01T00:00:00.000Z'
          }
        ],
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z'
      }
    ]
  ],
  'GET /api/financial-institutions/supported-parsers': () => [
    200,
    [
      { key: 'bac', label: 'BAC Credomatic' },
      { key: 'agricola', label: 'Banco Agrícola' }
    ]
  ],
  'POST /api/financial-institutions': body => [
    201,
    { id: 8, userId: 1, isActive: true, senders: [], ...body }
  ],
  'GET /api/notifications/preferences': () => [
    200,
    {
      gmailReviewEmailEnabled: false,
      gmailReviewPushEnabled: true,
      budgetAlertEmailEnabled: false
    }
  ],
  'PATCH /api/notifications/preferences': body => [200, body],
  'POST /api/auth/disable-2fa': body =>
    body?.token === '123456'
      ? [201, { msg: '2FA disabled' }]
      : [401, { message: 'Invalid 2FA code' }],
  'PATCH /api/auth/request-reset-password': () => [200, { msg: 'Sent' }],
  'POST /api/auth/logout-all': () => [200, { revoked: 2 }],
  'GET /api/auth/enable-2fa': () => [
    200,
    {
      secret: 'JBSWY3DPEHPK3PXP',
      qr: 'otpauth://totp/Prospero:ana%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Prospero'
    }
  ],
  'POST /api/auth/validate-2fa': body => [
    201,
    { verified: body?.token === '123456' }
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
  const query = Object.fromEntries(new URL(req.url, 'http://x').searchParams)
  requests.push({ method: req.method, path, query, body, headers: req.headers })

  // Review queue confirmations: PATCH /api/transactions/:id, /api/salary/:id
  const isPatchById =
    req.method === 'PATCH' && /^\/api\/(transactions|salary)\/\d+$/.test(path)
  // Fixed expense "Pagar": POST /api/fixed-expenses/:id/pay
  const isPay =
    req.method === 'POST' && /^\/api\/fixed-expenses\/\d+\/pay$/.test(path)
  // Bank sheet: PATCH /api/financial-institutions/:id
  const isPatchInstitution =
    req.method === 'PATCH' && /^\/api\/financial-institutions\/\d+$/.test(path)
  // Edit sheets: DELETE /api/transactions/:id, /api/salary/:id,
  // /api/fixed-expenses/:id
  const isDeleteById =
    req.method === 'DELETE' &&
    /^\/api\/(transactions|salary|fixed-expenses)\/\d+$/.test(path)
  const isPatchFixedExpense =
    req.method === 'PATCH' && /^\/api\/fixed-expenses\/\d+$/.test(path)
  const handler = isDeleteById
    ? () => [200, { id: Number(path.split('/').pop()) }]
    : isPatchById || isPatchInstitution || isPatchFixedExpense
    ? patchBody => [200, { id: Number(path.split('/').pop()), ...patchBody }]
    : isPay
    ? () => [201, { id: requests.length }]
    : routes[`${req.method} ${path}`]
  const [status, payload] = handler
    ? handler(body)
    : [404, { message: 'Not found (fake backend)' }]
  res.statusCode = status
  res.end(JSON.stringify(payload))
}).listen(PORT, () => console.log(`fake backend on :${PORT}`))
