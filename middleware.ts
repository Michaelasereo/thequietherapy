import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/therapist/dashboard/:path*',
    '/partner/dashboard/:path*',
    '/admin/dashboard/:path*'
  ],
};

export function middleware(req: NextRequest) {
  // Check for session cookie
  const sessionCookie = req.cookies.get('qth.sess');
  
  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    
    // Determine the appropriate login page based on the route
    if (url.pathname.startsWith('/therapist/')) {
      url.pathname = '/therapist/login';
    } else if (url.pathname.startsWith('/partner/')) {
      url.pathname = '/partner/login';
    } else if (url.pathname.startsWith('/admin/')) {
      url.pathname = '/admin/login';
    } else {
      url.pathname = '/login';
    }
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
