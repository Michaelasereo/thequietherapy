import { NextResponse } from 'next/server';
import { createMagicLinkForAuthType } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const result = await createMagicLinkForAuthType(
      email,
      'therapist',
      'login',
      { user_type: 'therapist' }
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
    console.error('Therapist magic link API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}