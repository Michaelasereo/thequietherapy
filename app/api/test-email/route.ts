import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    console.log('🧪 Testing email sending to:', email)
    
    const testUrl = 'http://localhost:3000/api/auth/verify-magic-link?token=test-token'
    
    const result = await sendMagicLinkEmail(
      email,
      testUrl,
      'signup',
      {
        user_type: 'therapist',
        first_name: 'Test User'
      }
    )
    
    console.log('📧 Email test result:', result)
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      messageId: result.messageId
    })
    
  } catch (error) {
    console.error('❌ Email test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
