import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'

export async function POST(request: NextRequest) {
  console.log('🚀 Registration API called')
  
  // Check environment variables
  console.log('Environment variables check:')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
  console.log('SUPABASE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')

  try {
    const body = await request.json()
    console.log('Registration request body:', body)
    
    const { firstName, email } = body

    if (!firstName || !email) {
      return NextResponse.json({ success: false, error: 'First name and email are required' }, { status: 400 })
    }

    // Create magic link for registration
    const magicLinkResult = await createMagicLink({
      email: email,
      type: 'signup',
      metadata: {
        first_name: firstName,
        user_type: 'individual'
      }
    })

    if (!magicLinkResult.success) {
      console.error('Magic link creation failed:', magicLinkResult.error)
      return NextResponse.json({ success: false, error: 'Failed to create magic link' }, { status: 500 })
    }

    console.log('Magic link email sent successfully to:', email)

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful! Please check your email for verification.',
      email: email
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
