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

// NextAuth v4's documented "refresh token rotation" recipe — see
// docs/auth-refresh-tokens.md's "Frontend" section for the full design.
// Never throws: a dead/revoked refresh token is a normal, expected outcome
// (token expired naturally, user logged out elsewhere, reuse detected), so
// it's surfaced as `token.error` instead, letting the session watcher /
// middleware / SSR guard decide to force a re-login rather than this
// callback crashing NextAuth's session handling.
const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  try {
    const response = await axios.post<RefreshTokenResponse>(
      `${getSelfBaseUrl()}/api/proxy/refresh-token`,
      { refreshToken: token.refreshToken }
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
