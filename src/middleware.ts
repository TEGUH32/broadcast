import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const isAuthPage = request.nextUrl.pathname === '/' || 
                     request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/register'
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  // If trying to access dashboard without token, redirect to home
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If trying to access auth pages with token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
