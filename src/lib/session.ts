import { config } from '@/config'
import type { GetServerSidePropsContext, Redirect } from 'next'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'

export interface ValidSessionResult {
  session: Session | null
  // Present (and only present) when the session's refresh token is dead —
  // callers should `return redirect` from `getServerSideProps` as-is.
  redirect?: { redirect: Redirect }
}

/**
 * Reads (and, when the access token is expired, silently refreshes) the
 * NextAuth session for a `getServerSideProps` page.
 *
 * Deliberately uses `getServerSession(req, res, config)` (`next-auth/next`)
 * instead of `getSession({ req })` (`next-auth/react`). The latter does an
 * HTTP self-fetch to this app's own `/api/auth/session` route — a *second*,
 * fully independent round trip that (a) races the browser's own session
 * poll to redeem the same refresh token (see `authConfig.ts`'s
 * `refreshAccessToken` in-flight dedup, which this still benefits from) and
 * (b) silently drops any rotated session cookie that self-fetch produces,
 * since `fetchData` in next-auth's client code only reads the response
 * body and never forwards its `Set-Cookie` header back onto this page's own
 * `res` (see `next-auth/src/client/_utils.ts`). That drop is the real
 * cause of the browser's cookie going stale relative to what the backend
 * just rotated — the next refresh attempt (from *any* path) then presents
 * an already-revoked refresh token, which the backend's reuse-detection
 * treats as theft and revokes the whole family, forcing an unexpected
 * logout (and, compounded with Safari's stricter cookie-commit timing, a
 * redirect loop — see `middleware.ts`).
 *
 * `getServerSession` runs the same NextAuth core handler **in-process**
 * (no HTTP hop) and copies any resulting `Set-Cookie` directly onto `res`,
 * so a refresh triggered during SSR is actually persisted to the real
 * browser cookie instead of being discarded. It shares the same `jwt`
 * callback (and therefore the same in-flight-refresh cache) as the
 * client-side session poll, so the two call sites can no longer redeem the
 * same refresh token twice.
 */
export const getValidSession = async (
  req: GetServerSidePropsContext['req'],
  res: GetServerSidePropsContext['res']
): Promise<ValidSessionResult> => {
  const session = await getServerSession(req, res, config)

  if (session?.error)
    return {
      session: null,
      redirect: { redirect: { destination: '/auth/login', permanent: false } }
    }

  return { session }
}
