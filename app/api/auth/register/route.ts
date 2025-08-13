import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('🚀 Registration API called');
  
  try {
    // Check if environment variables are available
    console.log('Environment variables check:');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
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
    
    const { firstName, email } = body;

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate input - removed password requirement for magic link auth
    if (!firstName || !email) {
      console.log('Missing fields:', { firstName: !!firstName, email: !!email });
      return NextResponse.json(
        { error: 'Missing required fields: firstName and email are required' },
        { status: 400 }
      );
    }

    // Create user profile in users table using service role key for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if user already exists (only verified users)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .eq('is_verified', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error checking user account' },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('Verified user already exists:', existingUser.email);
      return NextResponse.json(
        { error: 'An account with this email already exists. Please try logging in instead.' },
        { status: 400 }
      );
    }

    // Check if there's already a pending magic link for this email
    const { data: existingMagicLink, error: magicLinkCheckError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .eq('email', email)
      .eq('type', 'signup')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingMagicLink) {
      console.log('Pending magic link already exists for:', email);
      return NextResponse.json(
        { error: 'A verification email has already been sent to this address. Please check your email or wait before requesting another.' },
        { status: 400 }
      );
    }

    console.log('No existing verified user or pending magic link found, proceeding with registration');

    // Generate magic link token
    const magicLinkToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store magic link in database
    const { error: magicLinkError } = await supabaseAdmin
      .from('magic_links')
      .insert({
        email: email,
        token: magicLinkToken,
        type: 'signup',
        expires_at: expiresAt.toISOString(),
        metadata: {
          full_name: firstName,
          user_type: 'individual'
        }
      });

    if (magicLinkError) {
      console.error('Magic link creation error:', magicLinkError);
      return NextResponse.json(
        { error: 'Failed to create magic link' },
        { status: 400 }
      );
    }

    // Send magic link email via Brevo
    try {
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.log('Brevo SMTP credentials not available, skipping email');
      } else {
        const { sendMagicLinkEmail } = await import('@/lib/email');
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-magic-link?token=${magicLinkToken}`;
        await sendMagicLinkEmail(email, verificationUrl, 'signup', {
          full_name: firstName,
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
      message: 'Registration successful. Please check your email for verification.',
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
