import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return NextResponse.redirect(new URL('/auth?error=Invalid verification link', request.url));
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.redirect(new URL('/auth?error=User not found', request.url));
    }

    // Mark user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('email', email);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Create authentication session
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set authentication cookie
    response.cookies.set('trpi_user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.full_name
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth?error=Verification failed', request.url));
  }
}
