import { config } from '@/config'
import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib/apiService'
import { runWithClientIp } from '@/lib/server/clientIp'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

// Google redirects the browser here (GMAIL_OAUTH_REDIRECT_URI on the
// backend) after the consent screen. Completing with *this browser's*
// session lets the backend check that whoever approved is the same user who
// started the flow, so a consent link can't be forwarded to someone else.

const settingsUrl = (outcome: string): string =>
  outcome === 'connected'
    ? '/settings/gmail?gmail=connected'
    : `/settings/gmail?gmail=error&reason=${encodeURIComponent(outcome)}`

/** Completes the flow and returns where to send the browser. */
const completeAndGetRedirect = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string> => {
  const { code, state, error } = req.query
  // The user cancelled/denied on Google's consent screen.
  if (typeof error === 'string') return settingsUrl('cancelled')
  if (typeof code !== 'string' || typeof state !== 'string')
    return settingsUrl('invalid_request')

  const session = await getServerSession(req, res, config)
  if (!session?.accessToken || session.error) return '/auth/login'

  try {
    const { outcome } = await externalApiService.request<{ outcome: string }>({
      endPoint: '/gmail/oauth/complete',
      method: HttpMethod.POST,
      data: { code, state },
      headers: { Authorization: `Bearer ${session.accessToken}` }
    })
    return settingsUrl(outcome)
  } catch (requestError) {
    console.error('Error completing Gmail OAuth', requestError)
    return settingsUrl('unknown_error')
  }
}

export default async function gmailCallback(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  const location = await runWithClientIp(req, () =>
    completeAndGetRedirect(req, res)
  )
  res.redirect(302, location)
}
