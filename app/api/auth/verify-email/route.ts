import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('🔍 Email verification started')
  console.log('Email:', email)
  console.log('Token:', token)

  if (!email || !token) {
    console.log('❌ Missing email or token')
    return NextResponse.redirect(new URL('/login?error=missing-verification-data', request.url))
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 1: Find and validate the verification record
    console.log('🔍 Looking for verification record...')
    const { data: verification, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (findError || !verification) {
      console.log('❌ Verification record not found or expired:', findError?.message)
      return NextResponse.redirect(new URL('/login?error=invalid-verification', request.url))
    }

    console.log('✅ Verification record found')

    // Step 2: Mark verification as used
    console.log('📝 Marking verification as used...')
    const { error: markError } = await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.id)

    if (markError) {
      console.log('❌ Error marking verification as used:', markError.message)
      return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
    }

    // Step 3: Get or create user using the database function
    console.log('👤 Getting or creating user...')
    const { data: userId, error: userError } = await supabase
      .rpc('create_or_get_user', {
        p_email: email,
        p_full_name: verification.metadata?.first_name || email.split('@')[0],
        p_user_type: verification.metadata?.user_type || 'individual'
      })

    if (userError) {
      console.log('❌ Error creating/getting user:', userError.message)
      return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
    }

    console.log('✅ User ID:', userId)

    // Step 4: Update user to be verified
    console.log('✅ Updating user verification status...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        is_active: true
      })
      .eq('id', userId)

    if (updateError) {
      console.log('❌ Error updating user:', updateError.message)
      return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
    }

    // Step 5: Create session using the database function
    console.log('🔐 Creating user session...')
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { data: sessionId, error: sessionError } = await supabase
      .rpc('create_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_expires_at: sessionExpiresAt.toISOString(),
        p_user_agent: request.headers.get('user-agent') || null,
        p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
      })

    if (sessionError) {
      console.log('❌ Error creating session:', sessionError.message)
      return NextResponse.redirect(new URL('/login?error=session-creation-failed', request.url))
    }

    console.log('✅ Session created successfully')

    // Step 6: Get user data for cookie
    console.log('📋 Getting user data for cookie...')
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (userDataError) {
      console.log('❌ Error getting user data:', userDataError.message)
      return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
    }

    // Step 7: Redirect to dashboard with session cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    response.cookies.set("trpi_user", JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.full_name,
      session_token: sessionToken
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    console.log('✅ Redirecting to dashboard')
    return response

  } catch (error) {
    console.error('❌ Verification error:', error)
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
  }
}
