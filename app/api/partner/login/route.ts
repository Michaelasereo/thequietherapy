import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkForAuthType } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔑 Partner login request for:', email)

    // Create magic link for partner auth type
    const result = await createMagicLinkForAuthType(
      email, 
      'partner', 
      'login',
      {
        user_type: 'partner'
      }
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Magic link sent! Check your email to log in.'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send magic link' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Partner login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
