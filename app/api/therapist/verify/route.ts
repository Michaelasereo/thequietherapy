import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  console.log('🔍 GET /therapist/verify called')
  console.log('Token:', token)

  if (!token) {
    console.log('❌ Missing token')
    return NextResponse.redirect(new URL('/therapist/login?error=missing-token', request.url))
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
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (findError || !verification) {
      console.log('❌ Verification record not found or expired:', findError?.message)
      return NextResponse.redirect(new URL('/therapist/login?error=invalid-verification', request.url))
    }

    console.log('✅ Verification record found for email:', verification.email)

    // Step 2: Mark verification as used
    console.log('📝 Marking verification as used...')
    const { error: markError } = await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.id)

    if (markError) {
      console.log('❌ Error marking verification as used:', markError.message)
      return NextResponse.redirect(new URL('/therapist/login?error=verification-failed', request.url))
    }

    // Step 3: Get therapist data
    console.log('👤 Getting therapist data...')
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', verification.email)
      .single()

    if (therapistError || !therapistData) {
      console.log('❌ Error getting therapist data:', therapistError?.message)
      return NextResponse.redirect(new URL('/therapist/login?error=therapist-not-found', request.url))
    }

    console.log('✅ Therapist data found:', therapistData.id)

    // Step 4: Create session using direct SQL
    console.log('🔐 Creating therapist session...')
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Delete existing sessions for this therapist (clean slate approach)
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', therapistData.id)

    // Create new session
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: therapistData.id,
        session_token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
      })
      .select()
      .single()

    if (sessionError) {
      console.log('❌ Error creating session:', sessionError.message)
      return NextResponse.redirect(new URL('/therapist/login?error=session-creation-failed', request.url))
    }

    console.log('✅ Session created successfully')

    // Step 5: Redirect to dashboard with session cookie
    console.log('🔍 Verification: About to redirect to therapist dashboard')
    console.log('🔍 Verification: Therapist data for cookie:', therapistData)
    console.log('🔍 Verification: Session token:', sessionToken)
    
    const response = NextResponse.redirect(new URL('/therapist/dashboard', request.url))
    
    const cookieData = {
      id: therapistData.id,
      email: therapistData.email,
      name: therapistData.full_name,
      role: 'therapist',
      session_token: sessionToken
    }
    
    console.log('🔍 Verification: Setting cookie with data:', cookieData)
    
    // Set cookie with proper encoding
    const cookieValue = JSON.stringify(cookieData)
    console.log('🔍 Verification: Cookie value to set:', cookieValue)
    
    response.cookies.set("trpi_therapist_user", cookieValue, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    console.log('🔍 Verification: Cookie set, redirecting to therapist dashboard')
    return response

  } catch (error) {
    console.error('❌ Verification error:', error)
    return NextResponse.redirect(new URL('/therapist/login?error=verification-failed', request.url))
  }
}
