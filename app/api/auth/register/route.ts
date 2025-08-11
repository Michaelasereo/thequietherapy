import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are available
    console.log('Environment variables check:');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('SUPABASE_URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    console.log('SUPABASE_KEY starts with:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
    
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

    // Create user profile in users table using service role key for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate a unique user ID
    const userId = crypto.randomUUID();

    // Create user profile directly in the database
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        user_type: 'individual',
        is_verified: false,
        credits: 10, // Give new users 10 credits
        package_type: 'Basic'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 400 }
      );
    }

    console.log('User profile created successfully, user ID:', userId);

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

    // Send verification email via Brevo
    try {
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.log('Brevo SMTP credentials not available, skipping email');
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
        id: userId,
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
