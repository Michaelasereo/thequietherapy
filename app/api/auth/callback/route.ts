import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function redirectTo(url: string, base: string) {
  return NextResponse.redirect(new URL(url, base));
}

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  const { searchParams } = new URL(req.url);
  const userType = searchParams.get('user_type') || 'individual';

  try {
    console.log('🔍 Supabase auth callback - processing...');
    
    // Handle Supabase auth callback
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log('❌ Supabase auth callback failed:', error);
      return redirectTo('/login?error=auth_failed', base);
    }

    const user = data.session.user;
    console.log('✅ Supabase auth successful for user:', user.email);

    // Get user type from the auth data or URL parameter
    const userTypeFromAuth = user.user_metadata?.user_type || userType;
    
    // Redirect to appropriate dashboard
    let redirectPath = '/dashboard';
    if (userTypeFromAuth === 'therapist') {
      redirectPath = '/therapist/dashboard';
    } else if (userTypeFromAuth === 'partner') {
      redirectPath = '/partner/dashboard';
    } else if (userTypeFromAuth === 'admin') {
      redirectPath = '/admin/dashboard';
    }

    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectPath, base));
    
    // Set session cookie for the application
    response.cookies.set('supabase_session', JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        user_type: userTypeFromAuth,
        name: user.user_metadata?.full_name || user.email.split('@')[0]
      },
      session: data.session
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Auth callback error:', error);
    return redirectTo('/login?error=server_error', base);
  }
}
