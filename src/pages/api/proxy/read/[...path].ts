import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib/apiService'
import { HttpError } from '@/lib/apiService'
import { runWithClientIp } from '@/lib/server/clientIp'
import { HttpStatusCode } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

// Read-only pass-through for the screens that load their data client-side
// with SWR (see src/lib/useApi.ts). GET only, and only these backend paths:
// anything else is a 404 here, so this can't be used to reach other routes.
const READABLE_PATHS = new Set([
  'periods',
  'periods/current',
  'periods/month',
  'periods/transactions',
  'periods/salary',
  'transactions',
  'salary',
  'fixed-expenses',
  'review-queue/summary'
])

const toQuery = (query: NextApiRequest['query']): Record<string, string> =>
  Object.fromEntries(
    Object.entries(query)
      .filter(([key]) => key !== 'path')
      .flatMap(([key, value]) =>
        typeof value === 'string' ? [[key, value]] : []
      )
  )

export default async function readProxy(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== HttpMethod.GET) {
    res
      .status(HttpStatusCode.MethodNotAllowed)
      .json({ error: 'Method Not Allowed' })
    return
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : []
  const path = segments.join('/')
  if (!READABLE_PATHS.has(path)) {
    res.status(HttpStatusCode.NotFound).json({ message: 'Not found' })
    return
  }

  const { authorization, 'x-lang': lang } = req.headers
  try {
    const data = await runWithClientIp(req, () =>
      externalApiService.request<unknown>({
        method: HttpMethod.GET,
        endPoint: `/${path}`,
        query: toQuery(req.query),
        headers: {
          Authorization: authorization ?? '',
          'x-lang': typeof lang === 'string' ? lang : ''
        }
      })
    )
    // User data: never stored by the browser or any shared cache.
    res.setHeader('Cache-Control', 'private, no-store')
    res.status(HttpStatusCode.Ok).json(data)
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message })
      return
    }
    res.status(HttpStatusCode.InternalServerError).json({
      message: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}
