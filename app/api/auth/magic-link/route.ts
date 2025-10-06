import { NextResponse } from 'next/server';
import { createMagicLinkForAuthType } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, user_type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const authType = user_type || 'individual';
    
    const result = await createMagicLinkForAuthType(
      email,
      authType as 'individual' | 'therapist' | 'partner' | 'admin',
      'login',
      { user_type: authType }
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Magic link sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to create magic link' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Magic link API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
