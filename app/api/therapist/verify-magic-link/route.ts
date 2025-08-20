import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    console.log('🔍 Verifying therapist magic link:', { token: token?.substring(0, 10) + '...' })

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the magic link for therapist
    const result = await verifyMagicLinkForAuthType(token, 'therapist')
    
    if (result.success && result.user) {
      console.log('✅ Therapist magic link verified for user:', result.user.email)
      
      // Set therapist cookie
      const cookieStore = await cookies()
      const userData = {
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: 'therapist',
        session_token: result.user.session_token
      }
      
      cookieStore.set('trpi_therapist_user', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax'
      })

      console.log('🍪 Set therapist auth cookie')
      
      return NextResponse.json({
        success: true,
        message: 'Therapist authentication successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          user_type: result.user.user_type
        }
      })
    } else {
      console.error('❌ Therapist magic link verification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Therapist magic link verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
