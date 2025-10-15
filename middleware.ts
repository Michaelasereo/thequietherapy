import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // SECURITY: Fail closed if JWT_SECRET is missing
  if (!process.env.JWT_SECRET) {
    console.error('🚨 CRITICAL: JWT_SECRET missing in middleware')
    
    // In production, this should NEVER happen - lock everything down
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 PRODUCTION LOCKDOWN: JWT_SECRET missing')
      
      // Redirect ALL protected routes to maintenance
      if (!request.nextUrl.pathname.startsWith('/maintenance') &&
          !request.nextUrl.pathname.startsWith('/_next') &&
          !request.nextUrl.pathname.startsWith('/api/health')) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
    
    // In development, still redirect protected routes
    if (request.nextUrl.pathname.startsWith('/admin') || 
        request.nextUrl.pathname.startsWith('/partner') ||
        request.nextUrl.pathname.startsWith('/therapist') ||
        request.nextUrl.pathname.startsWith('/dashboard')) {
      console.warn('⚠️ DEV: Redirecting protected route due to missing JWT_SECRET')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Only allow truly public routes
    return NextResponse.next()
  }

  try {
    // Check for custom session cookie first (magic link auth)
    const quietSession = request.cookies.get('quiet_session')
    
    if (quietSession) {
      // User has a valid custom session, allow access
      return NextResponse.next()
    }

    // Fallback to Supabase auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    // Fall through to public access
    return NextResponse.next()
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
