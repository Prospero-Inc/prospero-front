import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import { HttpMethod } from './enums'

const allowedOrigins = ['http://31.220.97.169:4000/', 'http://localhost:3000']

// Opciones de CORS Comentario
const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// NextAuth's own session cookie, with or without the `__Secure-` prefix it
// uses when `NEXTAUTH_URL` is https (see next-auth's `cookies.ts`), and
// optionally chunked into `.0`, `.1`, ... suffixes when the encoded JWT is
// too large for a single cookie — matched by prefix so all variants (and
// any CSRF/callback-url cookies NextAuth sets alongside it) get cleared
// together.
const SESSION_COOKIE_PREFIXES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token'
]

/**
 * A session whose refresh failed (dead/revoked refresh token — see
 * `authConfig.ts`'s `jwt` callback) carries `token.error` inside a cookie
 * that otherwise still looks structurally valid. If the client-side
 * `signOut()` call that's supposed to clear it (`SessionWatcher`) hasn't
 * run yet, is slow, or — per the Safari report that prompted this — gets
 * caught by stricter ITP/cookie-commit timing between its own
 * fetch(`/api/auth/signout`) and the follow-up navigation, a request could
 * observe `token.error` on one hop and (if the stale cookie were still
 * sitting in the browser) something that looks valid again on the next,
 * bouncing between the protected page and `/auth/login` indefinitely —
 * exactly what "too many redirects" means.
 *
 * Deleting the cookie here, synchronously, on the very first request where
 * `token.error` is observed collapses that to a single terminal state: the
 * next request (whichever page it's for) has no cookie at all, which only
 * ever satisfies the "redirect to /auth/login" branch below — never the
 * "redirect away from /auth/login" one. This doesn't depend on `signOut()`
 * completing and runs before any page/client JS does.
 */
const clearSessionCookies = (req: NextRequest, res: NextResponse) => {
  for (const cookie of req.cookies.getAll())
    if (SESSION_COOKIE_PREFIXES.some(prefix => cookie.name.startsWith(prefix)))
      res.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
}

export async function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''
  const isAllowedOrigin = allowedOrigins.includes(origin)

  // Manejo de solicitudes OPTIONS para preflight
  const isPreflight = req.method === HttpMethod.OPTIONS
  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsOptions
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname.startsWith('/auth/verify-2fa')

  const isProtectedPage = !isAuthPage
  if (pathname === '/')
    return NextResponse.redirect(new URL('/dashboard', req.url))

  // A session whose refresh failed (dead/revoked refresh token) carries
  // `token.error` even though the NextAuth JWT itself hasn't expired yet —
  // treat it the same as "no token" everywhere below so it can't be used to
  // reach a protected page, and doesn't get bounced away from the login page
  // it needs to reach to re-authenticate.
  const hasValidToken = !!token && !token.error

  const response =
    isAuthPage && hasValidToken
      ? NextResponse.redirect(new URL('/dashboard', req.url))
      : isProtectedPage && !hasValidToken
      ? NextResponse.redirect(new URL('/auth/login', req.url))
      : NextResponse.next()

  // See `clearSessionCookies` above — do this unconditionally whenever the
  // token is present but dead, regardless of which branch handled the
  // request, so the stale cookie never survives into a second request.
  if (token?.error) clearSessionCookies(req, response)

  return response
}

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next).*)', '/']
}
