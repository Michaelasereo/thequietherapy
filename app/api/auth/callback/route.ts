import { NextResponse } from 'next/server';
import { validateMagicLink, markMagicLinkUsed } from '@/lib/auth/magic-link';
import { createSession } from '@/lib/auth/session';
import { writeSessionCookie } from '@/lib/auth/cookies';
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
  const token = searchParams.get('token');
  const userType = searchParams.get('userType') || 'individual';

  if (!token) {
    return redirectTo('/login?error=missing_token', base);
  }

  try {
    // Validate the magic link
    const { email, userType: linkUserType, isValid } = await validateMagicLink(token);

    if (!isValid || !email) {
      return redirectTo('/login?error=invalid_or_expired', base);
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return redirectTo('/login?error=user_not_found', base);
    }

    // Verify user type matches (if specified)
    if (userType !== 'individual' && user.user_type !== userType) {
      return redirectTo('/login?error=invalid_user_type', base);
    }

    // Mark magic link as used and create session atomically
    const sessionToken = await createSession(user.id, user.email, user.user_type);
    await markMagicLinkUsed(token);

    // Set session cookie
    await writeSessionCookie(sessionToken);

    // Redirect to appropriate dashboard
    let redirectPath = '/dashboard';
    if (user.user_type === 'therapist') {
      redirectPath = '/therapist/dashboard';
    } else if (user.user_type === 'partner') {
      redirectPath = '/partner/dashboard';
    } else if (user.user_type === 'admin') {
      redirectPath = '/admin/dashboard';
    }

    return redirectTo(redirectPath, base);

  } catch (error) {
    console.error('Auth callback error:', error);
    return redirectTo('/login?error=server_error', base);
  }
}
