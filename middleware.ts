import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE EXECUTING for:', request.nextUrl.pathname)
  console.log('📧 Request URL:', request.url)
  console.log('📧 User Agent:', request.headers.get('user-agent'))
  
  const { pathname } = request.nextUrl
  
  // Check if user is authenticated by looking for the auth cookie
  const userCookie = request.cookies.get('trpi_user')
  const individualCookie = request.cookies.get('trpi_individual_user')
  const therapistCookie = request.cookies.get('trpi_therapist_user')
  const partnerCookie = request.cookies.get('trpi_partner_user')
  const adminCookie = request.cookies.get('trpi_admin_user')
  
  console.log('🍪 Cookies found:', {
    user: !!userCookie,
    individual: !!individualCookie,
    therapist: !!therapistCookie,
    partner: !!partnerCookie,
    admin: !!adminCookie
  })
  
  // Check if any auth cookie exists
  const hasAnyAuthCookie = userCookie || individualCookie || therapistCookie || partnerCookie || adminCookie
  
  if (hasAnyAuthCookie) {
    console.log('✅ Auth cookie found, allowing access')
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
    if (!hasAnyAuthCookie) {
      console.log('❌ No auth cookie found, redirecting to login')
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
    
    // For individual dashboard, validate the session token
    if (pathname.startsWith('/dashboard') && (userCookie || individualCookie)) {
      try {
        const cookieToCheck = individualCookie || userCookie
        const userData = JSON.parse(decodeURIComponent(cookieToCheck!.value))
        if (!userData.session_token) {
          console.log('❌ No session token in individual cookie, redirecting to login')
          return NextResponse.redirect(new URL('/login', request.url))
        }
        console.log('✅ Individual session token validated')
      } catch (error) {
        console.log('❌ Invalid individual cookie format, redirecting to login')
        // Invalid cookie format, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    
    // For therapist dashboard, validate the session token
    if (pathname.startsWith('/therapist/dashboard') && therapistCookie) {
      try {
        const therapistData = JSON.parse(decodeURIComponent(therapistCookie.value))
        if (!therapistData.session_token) {
          console.log('❌ No session token in therapist cookie, redirecting to therapist login')
          return NextResponse.redirect(new URL('/therapist/login', request.url))
        }
        console.log('✅ Therapist session token validated')
      } catch (error) {
        console.log('❌ Invalid therapist cookie format, redirecting to therapist login')
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
    
    // For admin dashboard, validate the session token
    if (pathname.startsWith('/admin/dashboard') && adminCookie) {
      try {
        const adminData = JSON.parse(decodeURIComponent(adminCookie.value))
        if (!adminData.session_token) {
          console.log('❌ No session token in admin cookie, redirecting to admin login')
          return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        console.log('✅ Admin session token validated')
      } catch (error) {
        console.log('❌ Invalid admin cookie format, redirecting to admin login')
        // Invalid cookie format, redirect to admin login
        return NextResponse.redirect(new URL('/admin/login', request.url))
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
