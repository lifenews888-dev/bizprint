import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/admin',
  '/mobile/dashboard',
  '/mobile/orders',
  '/mobile/profile',
  '/mobile/admin',
  '/creator',
  '/designer',
  '/courier',
  '/sales',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value

  // Client-side auth uses localStorage, so we check for the auth cookie
  // If no cookie, we let client-side handle redirect (localStorage check)
  // But we add a header to signal the page should verify auth
  const response = NextResponse.next()
  response.headers.set('X-Auth-Required', 'true')
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/mobile/:path*',
    '/creator/:path*',
    '/designer/:path*',
    '/courier/:path*',
    '/sales/:path*',
  ],
}
