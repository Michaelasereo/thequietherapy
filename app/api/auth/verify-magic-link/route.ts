import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  console.log('🚀 MAGIC LINK VERIFICATION STARTED')
  console.log('📧 Request URL:', request.url)
  console.log('📧 User Agent:', request.headers.get('user-agent'))
  console.log('📧 Referer:', request.headers.get('referer'))
  
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const authType = searchParams.get('auth_type') as 'individual' | 'therapist' | 'partner' | 'admin'

    console.log('🔍 URL Parameters:', { token: token ? token.substring(0, 8) + '...' : 'null', authType })

    if (!token) {
      console.log('❌ No token provided')
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!authType) {
      console.log('❌ No auth type provided')
      return NextResponse.json(
        { success: false, error: 'Auth type is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Starting magic link verification:', { token: token.substring(0, 8) + '...', authType })

    // Verify the magic link
    const result = await verifyMagicLinkForAuthType(token, authType)

    if (!result.success) {
      console.error('❌ Magic link verification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

    console.log('✅ Magic link verified successfully')
    console.log('👤 User data:', {
      id: result.user?.id,
      email: result.user?.email,
      name: result.user?.full_name,
      session_token: result.user?.session_token ? result.user.session_token.substring(0, 8) + '...' : 'null'
    })

    // Set the appropriate session cookie based on auth type
    console.log('🍪 Setting session cookie...')
    const cookieStore = await cookies()
    const sessionData = {
      id: result.user?.id,
      email: result.user?.email,
      name: result.user?.full_name || result.user?.email?.split('@')[0],
      role: authType,
      session_token: result.user?.session_token
    }

    const cookieName = `trpi_${authType}_user`
    console.log('🍪 Cookie name:', cookieName)
    console.log('🍪 Session data:', sessionData)
    
    cookieStore.set(cookieName, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log('✅ Session cookie set for auth type:', authType)

    // Redirect to the appropriate dashboard
    let redirectUrl: string
    switch (authType) {
      case 'individual':
        redirectUrl = '/dashboard'
        break
      case 'therapist':
        redirectUrl = '/therapist/dashboard'
        break
      case 'partner':
        redirectUrl = '/partner/dashboard'
        break
      case 'admin':
        redirectUrl = '/admin/dashboard'
        break
      default:
        redirectUrl = '/dashboard'
    }

    console.log('🔄 Redirecting to:', redirectUrl)
    console.log('🌐 Full redirect URL:', new URL(redirectUrl, request.url).toString())
    
    // Use NextResponse.redirect for API routes
    console.log('✅ MAGIC LINK VERIFICATION COMPLETED - REDIRECTING')
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('❌ Magic link verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
