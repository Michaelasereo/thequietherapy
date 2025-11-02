import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  // Get base URL from config
  const baseUrl = authConfig.appUrl
  
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

      // Use absolute URL with baseUrl to ensure correct redirect
      const redirectAbsoluteUrl = new URL(redirectUrl, baseUrl).toString()
      const response = NextResponse.redirect(redirectAbsoluteUrl)

      // Create unified session using ServerSessionManager
      const sessionData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.full_name || result.user.email.split('@')[0],
        user_type: result.user.user_type || authType,
        is_verified: result.user.is_verified ?? true,
        is_active: result.user.is_active ?? true,
      }

      // Create JWT session token using SessionManager and pass response object
      await ServerSessionManager.createSession(sessionData, response)

      console.log('✅ Magic link verified successfully, redirecting to:', redirectAbsoluteUrl)
      
      return response
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
      
      return NextResponse.redirect(new URL(loginUrl, baseUrl))
    }
  } catch (error) {
    console.error('❌ Verify API error:', error)
    
    // Redirect to login with error
    return NextResponse.redirect(new URL('/login?error=server_error', baseUrl))
  }
}
