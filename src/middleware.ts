import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register') ||
    pathname.startsWith('/auth/forgot-password')

  const isProtectedPage = !isAuthPage
  if (pathname === '/')
    return NextResponse.redirect(new URL('/dashboard', req.url))

  if (isAuthPage && token)
    return NextResponse.redirect(new URL('/dashboard', req.url))

  if (isProtectedPage && !token)
    return NextResponse.redirect(new URL('/auth/login', req.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next).*)', '/']
}
