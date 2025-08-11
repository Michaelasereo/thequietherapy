import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create Supabase client inside the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await request.json();
    console.log('Registration request body:', body);
    
    const { fullName, email, password } = body;

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate input
    if (!fullName || !email || !password) {
      console.log('Missing fields:', { fullName: !!fullName, email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    console.log('Attempting Supabase signup for email:', email);
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
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: `Authentication failed: ${authError.message}` },
        { status: 400 }
      );
    }

    console.log('Supabase auth successful, user ID:', authData.user?.id);

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
      if (!process.env.RESEND_API_KEY) {
        console.log('RESEND_API_KEY not available, skipping email');
      } else {
        const { sendVerificationEmail } = await import('@/lib/email');
        await sendVerificationEmail(email, verificationToken);
        console.log('Email sent successfully to:', email);
      }
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
