import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib/apiService'
import axios from 'axios'
import { AuthOptions, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

interface UserExtended extends User {
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresIn?: number
}

interface UserResponse {
  user: User
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
}

type CredentialsInput = Record<
  | 'email'
  | 'password'
  | 'lang'
  | 'accessToken'
  | 'user'
  | 'refreshToken'
  | 'accessTokenExpiresIn',
  string
>

interface RefreshTokenResponse {
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
}

// `getSession`/`getServerSession` self-fetch this app's own `/api/auth/*`
// routes from the server side, so a relative URL (like the one
// `localApiService` uses in the browser) doesn't resolve here — build an
// absolute one from the same env vars `.env.example` documents for that
// purpose.
const getSelfBaseUrl = () =>
  (process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || '').replace(
    /\/$/,
    ''
  )

// ---------------------------------------------------------------------------
// In-flight refresh de-duplication.
//
// The backend's refresh tokens are single-use/rotating: presenting one that
// was already redeemed is treated as theft and revokes the *whole* token
// family (see docs/auth-refresh-tokens.md). Two call sites can race to
// redeem the same refresh token almost simultaneously — the browser's own
// `SessionProvider` poll (client-side, hits `/api/auth/session`) and a
// concurrent `getServerSideProps` SSR render (via `getValidSession` →
// `getServerSession`, see `lib/session.ts`) — both of which end up calling
// this same `jwt` callback.
//
// This cache is deliberately attached to `globalThis`, not a plain
// module-level `const`, and this is load-bearing, not stylistic — verified
// by reproducing the race locally (two concurrent requests sharing one
// cookie against the dev stack): a module-level `const Map()` here did
// *not* actually de-duplicate anything, because Next.js's Pages Router
// compiles `getServerSideProps` pages and `/api/auth/[...nextauth]` as
// separate on-demand webpack entries, each getting its *own* instantiation
// of this module (and therefore its own, unshared `Map`) even though both
// run inside the same Node process. `globalThis` is the one thing that actually
// is a true process-wide singleton regardless of how many separate module
// graphs require this file — the same trick commonly used for the Prisma
// Client singleton in Next.js dev mode, for the identical underlying reason.
//
// This still only closes the race within a single process. This app runs
// as one Node process per deployment with no horizontal replicas today
// (confirmed via `docker-compose.yml` / `prospero-front/docker-compose.yml`),
// so that's sufficient here — if it's ever scaled to multiple frontend
// instances behind a load balancer, this would need to move to something
// shared across processes (e.g. Redis) to keep closing the race.
//
// Keyed by the refresh token being redeemed, not by user id: a second
// caller that read the *same* (soon-to-be-stale) cookie value concurrently
// — or even just shortly after, before its own copy of the cookie could
// have been updated — gets the first call's result instead of making its
// own request. Entries are kept for a short grace period after the
// in-flight promise settles (not deleted immediately) specifically to
// cover that "shortly after, not literally concurrent" case.
const IN_FLIGHT_GRACE_PERIOD_MS = 10_000

declare global {
  // eslint-disable-next-line no-var
  var __prosperoInFlightRefreshes: Map<string, Promise<JWT>> | undefined
}

const getInFlightRefreshes = (): Map<string, Promise<JWT>> => {
  globalThis.__prosperoInFlightRefreshes ??= new Map()
  return globalThis.__prosperoInFlightRefreshes
}

// NextAuth v4's documented "refresh token rotation" recipe — see
// docs/auth-refresh-tokens.md's "Frontend" section for the full design.
// Never throws: a dead/revoked refresh token is a normal, expected outcome
// (token expired naturally, user logged out elsewhere, reuse detected), so
// it's surfaced as `token.error` instead, letting the session watcher /
// middleware / SSR guard decide to force a re-login rather than this
// callback crashing NextAuth's session handling.
const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  const currentRefreshToken = token.refreshToken

  // No refresh token to redeem at all (e.g. a pre-rollout session, see
  // docs/auth-refresh-tokens.md's "Rollout / compatibility") — nothing to
  // de-duplicate, just fail as before.
  if (!currentRefreshToken)
    return { ...token, error: 'RefreshAccessTokenError' }

  const inFlightRefreshes = getInFlightRefreshes()

  const existing = inFlightRefreshes.get(currentRefreshToken)
  if (existing) return existing

  const refreshPromise = (async (): Promise<JWT> => {
    try {
      const response = await axios.post<RefreshTokenResponse>(
        `${getSelfBaseUrl()}/api/proxy/refresh-token`,
        { refreshToken: currentRefreshToken }
      )

      return {
        ...token,
        accessToken: response.data.accessToken,
        accessTokenExpires:
          Date.now() + response.data.accessTokenExpiresIn * 1000,
        refreshToken: response.data.refreshToken,
        error: undefined
      }
    } catch (error) {
      console.error('Error refreshing access token', error)
      return { ...token, error: 'RefreshAccessTokenError' }
    }
  })()

  inFlightRefreshes.set(currentRefreshToken, refreshPromise)
  // Evict after the promise settles, but only after a short grace period —
  // see the comment on `IN_FLIGHT_GRACE_PERIOD_MS` above.
  void refreshPromise.finally(() => {
    setTimeout(() => {
      // Only delete if this exact promise is still the cached one (a newer
      // refresh for the same key could only happen after this one's own
      // grace period already elapsed and evicted it, but guard anyway).
      if (inFlightRefreshes.get(currentRefreshToken) === refreshPromise)
        inFlightRefreshes.delete(currentRefreshToken)
    }, IN_FLIGHT_GRACE_PERIOD_MS)
  })

  return refreshPromise
}

export const config: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com'
        },
        password: { label: 'Password', type: 'password' },
        lang: { label: 'Language', type: 'text' },
        // Populated instead of email/password once the login (and, when
        // required, the 2FA challenge) has already been resolved against
        // the backend by the login pages — see LoginView / verify-2fa.tsx.
        accessToken: { label: 'Access Token', type: 'text' },
        user: { label: 'User', type: 'text' },
        refreshToken: { label: 'Refresh Token', type: 'text' },
        accessTokenExpiresIn: {
          label: 'Access Token Expires In',
          type: 'text'
        }
      },
      authorize: async (
        credentials: Partial<CredentialsInput> | undefined
      ): Promise<UserExtended | null> => {
        if (!credentials) throw new Error('No credentials provided')

        if (credentials.accessToken && credentials.user)
          return {
            ...(JSON.parse(credentials.user) as User),
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            accessTokenExpiresIn: credentials.accessTokenExpiresIn
              ? Number(credentials.accessTokenExpiresIn)
              : undefined
          }

        const { email, password, lang } = credentials
        const response = await externalApiService.request<UserResponse>({
          endPoint: '/auth/login',
          method: HttpMethod.POST,
          data: {
            email,
            password
          },
          headers: {
            'x-lang': `${lang}`
          }
        })
        if (response)
          return {
            ...response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            accessTokenExpiresIn: response.accessTokenExpiresIn
          }

        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/signout'
    // forgot password?

    // reset password?
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpires =
          Date.now() + (user.accessTokenExpiresIn ?? 0) * 1000
        token.error = undefined
        return token
      }

      // `token.accessTokenExpires` is `undefined` for sessions issued before
      // this change rolled out (see docs/auth-refresh-tokens.md's
      // "Rollout / compatibility") — `Date.now() < (undefined ?? 0)` is
      // `false`, so those fall straight into `refreshAccessToken`, which
      // fails (no refresh token to send) and self-heals via `token.error`.
      if (Date.now() < (token.accessTokenExpires ?? 0)) return token

      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      // Deliberately NOT exposing token.refreshToken on `session` — it must
      // stay inside the httpOnly NextAuth JWT only, never reach browser JS.
      // See docs/auth-refresh-tokens.md.

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    // Revokes the refresh token server-side so "cerrar sesión" actually
    // invalidates the session instead of just clearing the NextAuth cookie
    // while the (still 30-day-valid) refresh token lives on.
    async signOut({ token }) {
      if (!token?.refreshToken) return

      try {
        await axios.post(`${getSelfBaseUrl()}/api/proxy/logout`, {
          refreshToken: token.refreshToken
        })
      } catch (error) {
        console.error('Error revoking refresh token on sign out', error)
      }
    }
  }
}
