import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('🚀 Login API called');
  
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
    console.log('Login request body:', body);
    
    const { email } = body;

    // Validate input
    if (!email) {
      console.log('Missing email field');
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error checking user account' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'No account found with this email. Please create an account first.' },
        { status: 404 }
      );
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
        type: 'login',
        expires_at: expiresAt.toISOString(),
        metadata: {
          full_name: existingUser.full_name,
          user_type: 'individual'
        }
      });

    if (magicLinkError) {
      console.error('Magic link creation error:', magicLinkError);
      return NextResponse.json(
        { error: 'Failed to create magic link' },
        { status: 500 }
      );
    }

    // Send magic link email via Brevo
    try {
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.log('Brevo SMTP credentials not available, skipping email');
      } else {
        const { sendMagicLinkEmail } = await import('@/lib/email');
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-magic-link?token=${magicLinkToken}`;
        await sendMagicLinkEmail(email, verificationUrl, 'login', {
          full_name: existingUser.full_name,
          user_type: 'individual'
        });
        console.log('Magic link email sent successfully to:', email);
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the login if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email. Please check your inbox.',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        full_name: existingUser.full_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
