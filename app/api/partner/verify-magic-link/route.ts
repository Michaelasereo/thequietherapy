import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    console.log('🔍 Verifying partner magic link:', { token: token?.substring(0, 10) + '...' })

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the magic link for partner
    const result = await verifyMagicLinkForAuthType(token, 'partner')
    
    if (result.success && result.user) {
      console.log('✅ Partner magic link verified for user:', result.user.email)
      
      // Set partner cookie
      const cookieStore = await cookies()
      const userData = {
        id: result.user.id,
        name: result.user.full_name || result.user.email.split('@')[0],
        email: result.user.email,
        role: 'partner',
        company_name: result.user.company_name,
        session_token: result.user.session_token
      }
      
      cookieStore.set('trpi_partner_user', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax'
      })

      console.log('🍪 Set partner auth cookie')
      
      return NextResponse.json({
        success: true,
        message: 'Partner authentication successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          user_type: result.user.user_type,
          company_name: result.user.company_name
        }
      })
    } else {
      console.error('❌ Partner magic link verification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Partner magic link verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
