import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE EXECUTING for:', request.nextUrl.pathname)
  console.log('📧 Request URL:', request.url)
  console.log('📧 User Agent:', request.headers.get('user-agent'))
  
  const { pathname } = request.nextUrl
  
  // Check if user is authenticated by looking for the auth cookie
  const userCookie = request.cookies.get('trpi_user')
  const therapistCookie = request.cookies.get('trpi_therapist_user')
  const partnerCookie = request.cookies.get('trpi_partner_user')
  
  console.log('🍪 Cookies found:', {
    user: !!userCookie,
    therapist: !!therapistCookie,
    partner: !!partnerCookie
  })
  
  if (partnerCookie) {
    console.log('🍪 Partner cookie value:', partnerCookie.value.substring(0, 100) + '...')
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
    // If no auth cookie is found, redirect to appropriate auth page
    if (!userCookie && !therapistCookie && !partnerCookie) {
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
    
    // For user dashboard, validate the session token
    if (pathname.startsWith('/dashboard') && userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie.value))
        if (!userData.session_token) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      } catch (error) {
        // Invalid cookie format, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    
    // For therapist dashboard, validate the session token
    if (pathname.startsWith('/therapist/dashboard') && therapistCookie) {
      try {
        const therapistData = JSON.parse(decodeURIComponent(therapistCookie.value))
        if (!therapistData.session_token) {
          return NextResponse.redirect(new URL('/therapist/login', request.url))
        }
      } catch (error) {
        // Invalid cookie format, redirect to therapist login
        return NextResponse.redirect(new URL('/therapist/login', request.url))
      }
    }
    
    // For partner dashboard, validate the session token
    if (pathname.startsWith('/partner/dashboard') && partnerCookie) {
      console.log('🔍 Validating partner session token...')
      try {
        const partnerData = JSON.parse(decodeURIComponent(partnerCookie.value))
        console.log('🍪 Partner data parsed:', {
          id: partnerData.id,
          email: partnerData.email,
          hasSessionToken: !!partnerData.session_token
        })
        if (!partnerData.session_token) {
          console.log('❌ No session token found, redirecting to partner auth')
          return NextResponse.redirect(new URL('/partner/auth', request.url))
        }
        console.log('✅ Partner session token validated')
      } catch (error) {
        console.log('❌ Invalid partner cookie format, redirecting to partner auth')
        // Invalid cookie format, redirect to partner auth
        return NextResponse.redirect(new URL('/partner/auth', request.url))
      }
    }
  }
  
  console.log('✅ MIDDLEWARE COMPLETED - allowing request to continue')
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
