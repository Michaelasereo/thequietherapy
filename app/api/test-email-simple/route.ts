import { NextResponse } from 'next/server'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('📧 Testing email sending to:', email)

    // Test email sending
    const testUrl = 'http://localhost:3001/api/auth/verify-magic-link?token=test-token&auth_type=individual'
    const result = await sendMagicLinkEmail(email, testUrl, 'login', { user_type: 'individual' })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Test email error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
