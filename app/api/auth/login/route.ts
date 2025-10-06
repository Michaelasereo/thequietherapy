import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkForAuthType } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userType = 'individual' } = body

    console.log('🔑 Login request:', { email, userType })

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!['individual', 'therapist', 'partner', 'admin'].includes(userType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user type' },
        { status: 400 }
      )
    }

    // Use the new unified magic link system
    const result = await createMagicLinkForAuthType(
      email,
      userType as 'individual' | 'therapist' | 'partner' | 'admin',
      'login',
      { user_type: userType }
    )
    
    if (result.success) {
      console.log('✅ Magic link created and sent for login:', { email, userType })
      return NextResponse.json({
        success: true,
        message: `Magic link sent to ${email}. Please check your email to log in.`
      })
    } else {
      console.error('❌ Failed to create magic link:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create magic link' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
