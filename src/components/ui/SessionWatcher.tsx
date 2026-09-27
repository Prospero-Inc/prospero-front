import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Renders nothing. Forces a real sign-out (and redirect to `/auth/login`)
 * as soon as the NextAuth session is marked `error: 'RefreshAccessTokenError'`
 * by the `jwt` callback in `authConfig.ts` — i.e. the backend refresh token
 * is dead/revoked and silent refresh can no longer keep the session alive.
 * See docs/auth-refresh-tokens.md.
 */
export const SessionWatcher = () => {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError')
      signOut({ callbackUrl: '/auth/login' })
  }, [session?.error])

  return null
}
