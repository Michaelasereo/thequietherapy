import { NextResponse } from 'next/server'
import { sendMagicLinkEmail, createTransporter } from '@/lib/email'

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

    // First, verify SMTP connection
    console.log('🔍 Verifying SMTP configuration...')
    const transporter = createTransporter()
    
    if (!transporter) {
      return NextResponse.json({
        success: false,
        error: 'SMTP transporter not available. Please check BREVO_SMTP_USER and BREVO_SMTP_PASS environment variables.',
        diagnostics: {
          hasUser: !!process.env.BREVO_SMTP_USER,
          hasPass: !!process.env.BREVO_SMTP_PASS,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 })
    }

    // Try to verify connection
    try {
      console.log('🔍 Verifying SMTP connection...')
      await transporter.verify()
      console.log('✅ SMTP connection verified successfully!')
    } catch (verifyError: any) {
      console.error('❌ SMTP connection verification failed:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed',
        details: {
          message: verifyError.message,
          code: verifyError.code,
          command: verifyError.command,
          response: verifyError.response
        }
      }, { status: 500 })
    }

    // Test email sending
    const testUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/verify-magic-link?token=test-token&auth_type=individual`
    const result = await sendMagicLinkEmail(email, testUrl, 'login', { user_type: 'individual' })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        magicLink: result.magicLink // Include in dev mode
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email',
        magicLink: result.magicLink // Include in dev mode if available
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Test email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
