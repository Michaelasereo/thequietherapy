import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, userType } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user from database
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // If user doesn't exist, create one
    if (userError || !user) {
      const { full_name, user_type, credits, package_type } = body;
      
      // Prepare user data based on user type
      const userData: any = {
        email,
        full_name: full_name || 'Test User',
        user_type: user_type || 'individual',
        is_verified: true,
        is_active: true
      };

      // Only set credits for individual users and partners, not therapists
      if (user_type !== 'therapist') {
        userData.credits = credits || 1; // Default to 1 credit for all non-therapist users
        userData.package_type = package_type || (user_type === 'partner' ? 'enterprise' : 'basic');
      }

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      user = newUser;
    }

    // Create session token
    const sessionToken = `dev-session-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: 'Dev Login',
        ip_address: '127.0.0.1'
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Create response with session cookie
    const userResponse: any = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      is_verified: user.is_verified
    };

    // Only include credits for non-therapist users
    if (user.user_type !== 'therapist') {
      userResponse.credits = user.credits;
      userResponse.package_type = user.package_type;
    }

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      sessionToken: sessionToken
    });

    // Set session cookie
    response.cookies.set('trpi_user_session', sessionToken, {
      httpOnly: true,
      secure: false, // false for localhost
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Also set user data cookie for frontend
    const cookieData: any = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      is_verified: user.is_verified
    };

    // Only include credits for non-therapist users
    if (user.user_type !== 'therapist') {
      cookieData.credits = user.credits;
      cookieData.package_type = user.package_type;
    }

    response.cookies.set('trpi_user', JSON.stringify(cookieData), {
      httpOnly: false, // accessible by frontend
      secure: false,
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
