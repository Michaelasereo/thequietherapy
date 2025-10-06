import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('🚀 Registration API called');
  
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
    
    const { email, fullName } = body;

    // Validate input
    if (!email || !fullName) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: email and fullName' },
        { status: 400 }
      );
    }

    console.log('Checking if user already exists:', email);

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email);

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error checking user account. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Users found:', existingUsers);

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.is_verified) {
        console.log('User already exists and is verified:', email);
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      } else {
        console.log('User exists but not verified, sending new verification:', email);
      }
    }

    // Generate magic link token
    const magicLinkToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Store magic link in database
    const { error: magicLinkError } = await supabaseAdmin
      .from('magic_links')
      .insert({
        email: email,
        token: magicLinkToken,
        type: 'signup',
        auth_type: 'individual',
        expires_at: expiresAt.toISOString(),
        metadata: {
          first_name: fullName,
          user_type: 'individual'
        }
      });

    if (magicLinkError) {
      console.error('Magic link creation error:', magicLinkError);
      return NextResponse.json(
        { error: 'Failed to create verification link' },
        { status: 500 }
      );
    }

    console.log('Magic link created successfully');

    // Send magic link email via Brevo
    try {
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.log('Brevo SMTP credentials not available, skipping email');
      } else {
        const { sendMagicLinkEmail } = await import('@/lib/email');
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${magicLinkToken}`;
        await sendMagicLinkEmail(email, verificationUrl, 'signup', {
          first_name: fullName,
          user_type: 'individual'
        });
        console.log('Magic link email sent successfully to:', email);
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
