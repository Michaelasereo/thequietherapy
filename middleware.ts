import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE EXECUTING for:', request.nextUrl.pathname)
  
  const { pathname } = request.nextUrl
  
  // Security: Block suspicious user agents
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.log('🚫 Blocked suspicious user agent:', userAgent)
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Security: Rate limiting headers (basic implementation)
  const response = NextResponse.next()
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Check for authentication cookies with consistent naming
  const authCookies = {
    individual: request.cookies.get('trpi_individual_user'),
    therapist: request.cookies.get('trpi_therapist_user'),
    partner: request.cookies.get('trpi_partner_user'),
    admin: request.cookies.get('trpi_admin_user')
  }
  
  console.log('🍪 Auth cookies found:', {
    individual: !!authCookies.individual,
    therapist: !!authCookies.therapist,
    partner: !!authCookies.partner,
    admin: !!authCookies.admin
  })
  
  // Validate session token from cookie
  const validateSessionToken = (cookie: any): boolean => {
    if (!cookie) return false
    
    try {
      const userData = JSON.parse(decodeURIComponent(cookie.value))
      return !!(userData && userData.session_token && userData.id)
    } catch (error) {
      console.log('❌ Invalid cookie format:', error)
      return false
    }
  }
  
  // Check if any valid auth cookie exists
  const hasValidAuth = Object.values(authCookies).some(cookie => validateSessionToken(cookie))
  
  if (hasValidAuth) {
    console.log('✅ Valid auth session found')
  }
  
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
    // If no valid auth cookie is found, redirect to appropriate auth page
    if (!hasValidAuth) {
      console.log('❌ No valid auth session found, redirecting to login')
      if (pathname.startsWith('/therapist/dashboard')) {
        return NextResponse.redirect(new URL('/therapist/login', request.url))
      } else if (pathname.startsWith('/admin/dashboard')) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      } else if (pathname.startsWith('/partner/dashboard')) {
        return NextResponse.redirect(new URL('/partner/auth', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    
    // Route-specific validation
    if (pathname.startsWith('/dashboard') && !authCookies.individual) {
      console.log('❌ Individual dashboard requires individual user cookie')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (pathname.startsWith('/therapist/dashboard') && !authCookies.therapist) {
      console.log('❌ Therapist dashboard requires therapist user cookie')
      return NextResponse.redirect(new URL('/therapist/login', request.url))
    }
    
    if (pathname.startsWith('/partner/dashboard') && !authCookies.partner) {
      console.log('❌ Partner dashboard requires partner user cookie')
      return NextResponse.redirect(new URL('/partner/auth', request.url))
    }
    
    if (pathname.startsWith('/admin/dashboard') && !authCookies.admin) {
      console.log('❌ Admin dashboard requires admin user cookie')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  console.log('✅ MIDDLEWARE COMPLETED - allowing request to continue')
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/therapist/dashboard/:path*',
    '/admin/dashboard/:path*',
    '/partner/dashboard/:path*'
  ]
}
