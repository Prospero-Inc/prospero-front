import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import { HttpMethod } from './enums'

const allowedOrigins = ['http://31.220.97.169:3000/', 'http://localhost:3000']

// Opciones de CORS
const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
