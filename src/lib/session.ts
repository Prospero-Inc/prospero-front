import type { GetServerSidePropsContext, Redirect } from 'next'
import type { Session } from 'next-auth'
import { getSession } from 'next-auth/react'

export interface ValidSessionResult {
  session: Session | null
  // Present (and only present) when the session's refresh token is dead —
  // callers should `return redirect` from `getServerSideProps` as-is.
  redirect?: { redirect: Redirect }
}

/**
 * Wraps `getSession({ req })` for `getServerSideProps` pages, additionally
 * treating a session with `session.error === 'RefreshAccessTokenError'`
 * (see `authConfig.ts`'s `jwt` callback / docs/auth-refresh-tokens.md) the
 * same as "no session": redirect to `/auth/login` instead of rendering the
 * page with a backend `accessToken` that no longer authenticates.
 */
export const getValidSession = async (
  req: GetServerSidePropsContext['req']
): Promise<ValidSessionResult> => {
  const session = await getSession({ req })

  if (session?.error)
    return {
      session: null,
      redirect: { redirect: { destination: '/auth/login', permanent: false } }
    }

  return { session }
}
