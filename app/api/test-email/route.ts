import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Testing Brevo email sending to:', email)

    const testUrl = 'http://localhost:3000/api/auth/verify-magic-link?token=test-token'
    
    const result = await sendMagicLinkEmail(email, testUrl, 'signup', {
      first_name: 'Test User',
      user_type: 'therapist'
    })

    console.log('Brevo email test result:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully via Brevo',
      result: result
    })
  } catch (error) {
    console.error('Error sending test email via Brevo:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email via Brevo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
