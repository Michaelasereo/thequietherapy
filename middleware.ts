import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Gracefully handle missing JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not available in middleware - proceeding with public access')
    
    // For critical auth routes, redirect to maintenance page
    if (request.nextUrl.pathname.startsWith('/admin') || 
        request.nextUrl.pathname.startsWith('/partner') ||
        request.nextUrl.pathname.startsWith('/therapist')) {
      console.log('Redirecting protected route to maintenance due to missing JWT_SECRET')
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
    
    // For public routes, continue without auth
    return NextResponse.next()
  }

  try {
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

    // Rest of your auth logic...
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    // Fall through to public access
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*', '/partner/:path*', '/therapist/:path*', '/dashboard/:path*']
}
