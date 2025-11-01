import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ServerSessionManager } from '@/lib/server-session-manager'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that should always be accessible
  const publicRoutes = [
    '/admin/login',
    '/admin/register',
    '/admin/signup',
    '/therapist/login',
    '/therapist/register',
    '/therapist/enroll',
    '/partner/login',
    '/partner/register',
    '/partner/enroll',
    '/login',
    '/register',
    '/',
  ]

  // Check if this is a public route - allow through without auth
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  try {
    // Check for custom session cookie first (magic link auth)
    const quietSession = request.cookies.get('quiet_session')
    
    if (quietSession?.value) {
      // Validate the session token to ensure it's not expired
      const sessionData = ServerSessionManager.validateSession(quietSession.value)
      
      if (sessionData) {
        // User has a valid custom session, allow access
        return NextResponse.next()
      } else {
        // Session is invalid or expired, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        // Clear the invalid cookie
        response.cookies.delete('quiet_session')
        return response
      }
    }

    // No valid session found, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
    
  } catch (error) {
    console.error('Middleware error:', error)
    // Fall through to redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/admin/((?!login|register).*)',
    '/partner/((?!login|register|enroll).*)',
    '/therapist/((?!login|register|enroll).*)',
    '/dashboard/:path*'
  ]
}
