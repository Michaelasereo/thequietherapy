import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { fullName, email, password } = await request.json();

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate input
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = randomUUID();

    // Store verification token in database (you might want to create a separate table for this)
    // For now, we'll use the user's metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { verification_token: verificationToken }
    });

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Send verification email via Resend
    try {
      await sendVerificationEmail(email, verificationToken);
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the registration if email fails
    }

    // Create user profile in users table using service role key for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user?.id,
        email: email,
        full_name: fullName,
        user_type: 'individual',
        is_verified: false,
        credits: 10, // Give new users 10 credits
        package_type: 'Basic'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: authData.user?.id,
        email: email,
        full_name: fullName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
