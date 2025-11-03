import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const authType = searchParams.get('auth_type')

  try {
    console.log(`🔐 Verifying magic link for auth type: ${authType}`)
    
    // Get base URL - use request origin in development, config in production
    const requestUrl = new URL(request.url)
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? authConfig.appUrl 
      : `${requestUrl.protocol}//${requestUrl.host}`
    
    console.log(`📍 Using base URL: ${baseUrl}`)
    console.log(`📍 Request URL: ${request.url}`)
    
    if (!token || !authType) {
      return NextResponse.redirect(
        new URL('/auth/error?error=' + encodeURIComponent('Invalid verification link'), baseUrl)
      )
    }

    // Validate auth type
    const validAuthTypes = ['individual', 'therapist', 'partner', 'admin'] as const
    if (!validAuthTypes.includes(authType as any)) {
      return NextResponse.redirect(
        new URL('/auth/error?error=' + encodeURIComponent('Invalid authentication type'), baseUrl)
      )
    }

    // Verify the magic link
    const result = await verifyMagicLinkForAuthType(token, authType as 'individual' | 'therapist' | 'partner' | 'admin')
    
    if (!result.success) {
      console.error('❌ Magic link verification failed:', result.error)
      
      // If there's a redirect URL in the result, use it
      if (result.redirectTo) {
        return NextResponse.redirect(new URL(result.redirectTo, baseUrl))
      }
      
      // Otherwise, show error page
      const errorMessage = encodeURIComponent(result.error || 'Verification failed')
      return NextResponse.redirect(
        new URL(`/auth/error?error=${errorMessage}`, baseUrl)
      )
    }
    
    if (!result.user) {
      console.error('❌ No user returned from magic link verification')
      return NextResponse.redirect(
        new URL('/auth/error?error=' + encodeURIComponent('No user data returned'), baseUrl)
      )
    }

    console.log('✅ Magic link verified successfully for user:', result.user.email)

    // Create session data with proper typing
    const sessionData = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.full_name || result.user.email.split('@')[0],
      user_type: result.user.user_type || authType,
      is_verified: result.user.is_verified ?? true,
      is_active: result.user.is_active ?? true,
    }

    // Create the redirect URL based on auth type
    const getDashboardUrl = (type: string): string => {
      switch (type) {
        case 'therapist': return '/therapist/dashboard'
        case 'partner': return '/partner/dashboard'
        case 'admin': return '/admin/dashboard'
        case 'individual':
        default: return '/dashboard'
      }
    }
    const redirectUrl = getDashboardUrl(authType)

    // Use absolute URL with baseUrl to ensure correct redirect
    const redirectAbsoluteUrl = new URL(redirectUrl, baseUrl).toString()
    console.log('🔗 Redirect URL:', redirectAbsoluteUrl)
    
    // Create redirect response
    const response = NextResponse.redirect(redirectAbsoluteUrl)

    // Create JWT session token using SessionManager and pass response object
    // IMPORTANT: Set cookie BEFORE redirect to ensure it's included in response
    const sessionToken = await ServerSessionManager.createSession(sessionData, response)

    console.log('🍪 Session created and cookie set for:', result.user.email)
    console.log('🔑 Auth type:', authType)
    console.log('📍 Redirecting to:', redirectAbsoluteUrl)
    console.log('🍪 Cookie name: quiet_session')
    console.log('🍪 Cookie value length:', sessionToken.length)
    
    // Verify cookie was set in response
    const cookieValue = response.cookies.get('quiet_session')
    if (cookieValue) {
      console.log('✅ Cookie confirmed in response headers')
      console.log('   Cookie will be sent with redirect response')
    } else {
      console.error('❌ WARNING: Cookie not found in response headers!')
      // This shouldn't happen, but if it does, log it for debugging
    }

    // Add a special header to indicate this is a magic link redirect
    // This helps the client-side know to wait a bit for the cookie
    response.headers.set('X-Magic-Link-Redirect', 'true')

    return response

  } catch (error) {
    console.error('❌ Magic link verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/error?error=' + encodeURIComponent('Internal server error'), authConfig.appUrl)
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userType = 'individual' } = body

    console.log('🔍 Verifying magic link:', { token: token?.substring(0, 10) + '...', userType })

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the magic link
    const result = await verifyMagicLinkForAuthType(token, userType)
    
    if (result.success && result.user) {
      console.log('✅ Magic link verified for user:', result.user.email)
      
      // Create session using the new session manager
      const sessionToken = await ServerSessionManager.createSession({
        id: result.user.id,
        email: result.user.email,
        name: result.user.full_name || result.user.email.split('@')[0],
        user_type: result.user.user_type || userType,
        is_verified: result.user.is_verified || false,
        is_active: result.user.is_active || true,
      })

      console.log('🍪 Created unified session for:', userType, 'Token:', sessionToken.substring(0, 20) + '...')
      
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          user_type: result.user.user_type
        }
      })
    } else {
      console.error('❌ Magic link verification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired magic link' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Magic link verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
