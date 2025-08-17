import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /auth/signup called');
  
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    console.log('Signup request body:', body);
    
    const { email, fullName } = body;

    // Validate input
    if (!email || !fullName) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists and is verified
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error checking user account' },
        { status: 500 }
      );
    }

    if (existingUser && existingUser.is_verified) {
      console.log('User already exists and is verified:', email);
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: tokenError } = await supabase
      .from('magic_links')
      .insert({
        email: email,
        token: verificationToken,
        type: 'signup',
        expires_at: expiresAt.toISOString(),
        metadata: {
          first_name: fullName,
          user_type: 'individual'
        }
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    console.log('Verification token created successfully');

    // Send verification email
    try {
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.log('Brevo SMTP credentials not available, logging verification URL');
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}`;
        console.log('🔗 Verification URL:', verificationUrl);
      } else {
        const { sendMagicLinkEmail } = await import('@/lib/email');
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}`;
        await sendMagicLinkEmail(email, verificationUrl, 'signup', {
          first_name: fullName,
          user_type: 'individual'
        });
        console.log('Verification email sent successfully to:', email);
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Verification link sent to your email. Please check your inbox to complete registration.',
      user: {
        email: email,
        full_name: fullName
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
