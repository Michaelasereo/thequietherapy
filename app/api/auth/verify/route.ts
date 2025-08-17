import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const authType = searchParams.get('auth_type') || 'individual'

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying magic link:', { token: token.substring(0, 8) + '...', authType })

    // Verify magic link for specific auth type
    const result = await verifyMagicLinkForAuthType(token, authType as any)

    if (result.success && result.user) {
      // Set appropriate cookie based on auth type
      const cookieStore = await cookies()
      const cookieName = `trpi_${authType}_user`
      
      cookieStore.set(cookieName, JSON.stringify({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        auth_type: authType,
        session_token: result.user.session_token
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      })

      // Redirect to appropriate dashboard based on auth type
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

      console.log('✅ Magic link verified successfully, redirecting to:', redirectUrl)
      
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    } else {
      console.log('❌ Magic link verification failed:', result.error)
      
      // Redirect to appropriate login page with error
      let loginUrl: string
      switch (authType) {
        case 'individual':
          loginUrl = '/login?error=invalid_link'
          break
        case 'therapist':
          loginUrl = '/therapist/login?error=invalid_link'
          break
        case 'partner':
          loginUrl = '/partner/auth?error=invalid_link'
          break
        case 'admin':
          loginUrl = '/admin/login?error=invalid_link'
          break
        default:
          loginUrl = '/login?error=invalid_link'
      }
      
      return NextResponse.redirect(new URL(loginUrl, request.url))
    }
  } catch (error) {
    console.error('❌ Verify API error:', error)
    
    // Redirect to login with error
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
