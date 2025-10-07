import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function redirectTo(url: string, base: string) {
  return NextResponse.redirect(new URL(url, base));
}

function getDashboardUrl(userType: string | null): string {
  switch (userType) {
    case 'therapist':
      return '/therapist/dashboard';
    case 'partner':
      return '/partner/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
}

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userType = searchParams.get('user_type') || 'individual';
  const authType = searchParams.get('type') || 'login';
  const redirectUrl = searchParams.get('redirect_url');

  try {
    console.log('🔍 OAuth callback processing...', { 
      userType, 
      authType, 
      hasCode: !!code,
      redirectUrl 
    });

    if (!code) {
      console.log('❌ No authorization code found');
      return redirectTo(`/login?error=no_code&user_type=${userType}`, base);
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.session) {
      console.log('❌ Failed to exchange code for session:', error);
      return redirectTo(`/login?error=auth_failed&user_type=${userType}`, base);
    }

    const user = data.session.user;
    console.log('✅ OAuth successful for user:', user.email);

    // Update user metadata with user_type if provided
    if (userType && data.user) {
      console.log('🔄 Updating user metadata with user_type:', userType);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          user_type: userType,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        }
      });

      if (updateError) {
        console.error('❌ Failed to update user metadata:', updateError);
      } else {
        console.log('✅ User metadata updated successfully');
      }
    }

    // Determine redirect path
    const redirectPath = redirectUrl || getDashboardUrl(userType);
    console.log('🔄 Redirecting to:', redirectPath);

    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectPath, base));
    
    // Set session cookie for the application
    response.cookies.set('supabase_session', JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        user_type: userType,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
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
    console.error('❌ Auth callback error:', error);
    return redirectTo(`/login?error=server_error&user_type=${userType}`, base);
  }
}
