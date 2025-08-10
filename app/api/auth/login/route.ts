import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Create response with authentication cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: authData.user,
      profile: profile
    });

    // Set authentication cookie
    response.cookies.set('trpi_user', JSON.stringify({
      id: authData.user?.id,
      email: authData.user?.email,
      name: profile?.full_name || authData.user?.email?.split('@')[0]
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
