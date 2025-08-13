import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user is authenticated by looking for the auth cookie
  const userCookie = request.cookies.get('trpi_user')
  const therapistCookie = request.cookies.get('trpi_therapist_user')
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/therapist/dashboard',
    '/admin/dashboard',
    '/partner/dashboard'
  ]
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // If no auth cookie is found, redirect to appropriate auth page
    if (!userCookie && !therapistCookie) {
      if (pathname.startsWith('/therapist/dashboard')) {
        return NextResponse.redirect(new URL('/therapist/login', request.url))
      } else if (pathname.startsWith('/admin/dashboard')) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      } else if (pathname.startsWith('/partner/dashboard')) {
        return NextResponse.redirect(new URL('/partner/login', request.url))
      } else {
        return NextResponse.redirect(new URL('/auth', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/therapist/dashboard/:path*',
    '/admin/dashboard/:path*',
    '/partner/dashboard/:path*'
  ]
}
