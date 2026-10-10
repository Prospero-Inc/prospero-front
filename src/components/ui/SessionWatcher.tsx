import { signOut, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

/**
 * Renders nothing. Forces a real sign-out (and redirect to `/auth/login`)
 * as soon as the NextAuth session is marked `error: 'RefreshAccessTokenError'`
 * by the `jwt` callback in `authConfig.ts` — i.e. the backend refresh token
 * is dead/revoked and silent refresh can no longer keep the session alive.
 * See docs/auth-refresh-tokens.md.
 */
export const SessionWatcher = () => {
  const { data: session } = useSession()
  // Guards against calling `signOut()` more than once for the same dead
  // session. The `[session?.error]` effect dependency already shouldn't
  // re-fire while the error value stays the same string across polls, but
  // this also covers `session?.error` flapping (e.g. a stale poll resolving
  // out of order) — only ever the first observed failure should trigger a
  // sign-out; `middleware.ts` independently clears the stale cookie as a
  // backstop if this never gets to run (see its `clearSessionCookies`).
  const hasTriggeredSignOut = useRef(false)

  useEffect(() => {
    if (
      session?.error === 'RefreshAccessTokenError' &&
      !hasTriggeredSignOut.current
    ) {
      hasTriggeredSignOut.current = true
      signOut({ callbackUrl: '/auth/login' })
    }
  }, [session?.error])

  return null
}
