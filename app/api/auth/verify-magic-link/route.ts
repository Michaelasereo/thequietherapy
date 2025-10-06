import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkForAuthType } from '@/lib/auth'
import { ServerSessionManager } from '@/lib/server-session-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const authType = searchParams.get('auth_type')

  try {
    console.log(`🔐 Verifying magic link for auth type: ${authType}`)
    
    if (!token || !authType) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid verification link', request.url)
      )
    }

    // Validate auth type
    const validAuthTypes = ['individual', 'therapist', 'partner', 'admin'] as const
    if (!validAuthTypes.includes(authType as any)) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid authentication type', request.url)
      )
    }

    // Verify the magic link
    const result = await verifyMagicLinkForAuthType(token, authType as 'individual' | 'therapist' | 'partner' | 'admin')
    
    if (!result.success || !result.user) {
      console.error('❌ Magic link verification failed:', result.error)
      return NextResponse.redirect(
        new URL(`/auth/error?error=${result.error || 'Verification failed'}`, request.url)
      )
    }

    console.log('✅ Magic link verified successfully for user:', result.user.email)

    // Create session data with proper typing
    const sessionData = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.full_name || result.user.email.split('@')[0],
      role: authType as 'admin' | 'partner' | 'therapist' | 'individual',
      user_type: result.user.user_type || authType,
      is_verified: result.user.is_verified || false,
      is_active: result.user.is_active || true,
      session_token: result.user.session_token
    }

    // Create JWT session token using SessionManager
    const sessionToken = await ServerSessionManager.createSession(sessionData)

    // Create the redirect response FIRST
    let redirectUrl = '/dashboard'
    if (authType === 'therapist') redirectUrl = '/therapist/dashboard'
    if (authType === 'partner') redirectUrl = '/partner/dashboard'
    if (authType === 'admin') redirectUrl = '/admin/dashboard'

    const response = NextResponse.redirect(new URL(redirectUrl, request.url))

    // Set the JWT session cookie
    response.cookies.set({
      name: 'quiet_session',
      value: sessionToken, // This is now a JWT token, not JSON
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    })

    console.log('🍪 Session cookies set successfully for:', result.user.email)
    console.log('🔑 Auth type:', authType)
    console.log('📍 Redirecting to:', redirectUrl)

    return response

  } catch (error) {
    console.error('❌ Magic link verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/error?error=Internal server error', request.url)
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
        role: userType as 'individual' | 'therapist' | 'partner' | 'admin',
        user_type: result.user.user_type || userType,
        is_verified: result.user.is_verified || false,
        is_active: result.user.is_active || true,
        session_token: result.user.session_token
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
