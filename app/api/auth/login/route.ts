import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth/magic-link'
import { sendMagicLinkEmail } from '@/lib/email'

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

    // Create magic link for the specific user type
    const magicLinkUrl = await createMagicLink(email, userType as any)
    
    // Send the magic link email
    const emailResult = await sendMagicLinkEmail(email, magicLinkUrl, 'login', { user_type: userType })
    
    if (emailResult.success) {
      console.log('✅ Magic link created and sent for login:', { email, userType })
      return NextResponse.json({
        success: true,
        message: `Magic link sent to ${email}. Please check your email to log in.`
      })
    } else {
      console.error('❌ Failed to send magic link email:', emailResult.error)
      return NextResponse.json(
        { success: false, error: 'Failed to send magic link email' },
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
