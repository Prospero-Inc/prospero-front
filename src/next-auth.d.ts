// next-auth.d.ts

import { Session as NextAuthSession, User as NextAuthUser } from 'next-auth'
import { JWT as NextAuthJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends NextAuthSession {
    accessToken?: string
    // Set by the `jwt` callback when refreshing the backend access token
    // fails (dead/revoked refresh token). Client code (the session watcher,
    // `middleware.ts`, `getServerSideProps` pages) checks this to force a
    // re-login instead of trusting a session that looks alive but can no
    // longer authenticate against the backend.
    error?: string
  }

  interface User extends NextAuthUser {
    accessToken?: string
    // Only ever read inside `authConfig.ts`'s `jwt` callback (to seed
    // `token.refreshToken`/`token.accessTokenExpires`) — never copied onto
    // `Session`, so it never reaches browser JS. See docs/auth-refresh-tokens.md.
    refreshToken?: string
    // Seconds-to-expiry for `accessToken`, as returned by the backend.
    accessTokenExpiresIn?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    accessToken?: string
    // Lives only inside the encrypted, httpOnly NextAuth JWT — must never be
    // copied onto `Session` (see the `session` callback in `authConfig.ts`).
    refreshToken?: string
    // Epoch ms timestamp; compared against `Date.now()` to decide whether the
    // `jwt` callback needs to refresh before returning the token.
    accessTokenExpires?: number
    error?: string
  }
}
