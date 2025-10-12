import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/auth/session'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Auto-login endpoint for development/testing
 * ⚠️ ONLY USE IN DEVELOPMENT - DO NOT ENABLE IN PRODUCTION
 */
export async function GET(request: NextRequest) {
  try {
    // Check if in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Auto-login is disabled in production' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const redirect = searchParams.get('redirect') || '/dashboard'

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Auto-login request for:', email)

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Update user with session token
    await supabase
      .from('users')
      .update({
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id)

    console.log('✅ Session token generated for:', user.email)

    // Create session cookie
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type
      },
      token: sessionToken,
      expiresAt: sessionExpiresAt.toISOString()
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL(redirect, request.url))
    
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false, // Development only
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    response.cookies.set('user_type', user.user_type, {
      httpOnly: false,
      secure: false, // Development only
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    })

    console.log('✅ Auto-login successful, redirecting to:', redirect)

    return response

  } catch (error) {
    console.error('❌ Error in auto-login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

