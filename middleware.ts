import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ServerSessionManager } from '@/lib/server-session-manager'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/campaigns',
  '/support',
  '/faqs',
  '/articles',
  '/therapist/login',
  '/therapist/enroll',
  '/partner/login',
  '/partner/enroll',
  '/admin/login',
  '/admin/enroll',
  '/api/auth/send-magic-link',
  '/api/auth/verify-magic-link',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/.well-known'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🛣️ Middleware processing: ${pathname}`);
  
  // Allow public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/') || pathname.startsWith('/_next') || pathname.startsWith('/api/')
  )
  
  if (isPublicRoute) {
    console.log(`🔓 Public route allowed: ${pathname}`);
    return NextResponse.next();
  }
  
  console.log(`🔒 Protected route: ${pathname}`);
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('quiet_session');
  
  if (!sessionCookie) {
    console.log(`❌ No session cookie found, redirecting to login`);
    
    // Determine redirect URL based on path
    let redirectUrl = '/login';
    if (pathname.startsWith('/therapist/')) {
      redirectUrl = '/therapist/login';
    } else if (pathname.startsWith('/partner/')) {
      redirectUrl = '/login?user_type=partner';
    } else if (pathname.startsWith('/admin/')) {
      redirectUrl = '/login?user_type=admin';
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  
  // Validate session (optional - can be done in components for better performance)
  try {
        const sessionData = ServerSessionManager.validateSession(sessionCookie.value);
    if (!sessionData) {
      console.log(`❌ Invalid session, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log(`✅ Valid session for user: ${sessionData.email}`);
    return NextResponse.next();
  } catch (error) {
    console.log(`❌ Session validation error, redirecting to login:`, error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};