import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🔍 GET /auth/me called')
  
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Cookie header:', cookieHeader)
    
    if (!cookieHeader) {
      console.log('❌ No cookie header found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Parse cookies more robustly
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {} as Record<string, string>)

    console.log('🔍 Parsed cookies:', cookies)

    const trpiUserCookie = cookies['trpi_user']
    if (!trpiUserCookie) {
      console.log('❌ No trpi_user cookie found')
      console.log('🔍 Available cookies:', Object.keys(cookies))
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('🔍 Found trpi_user cookie:', trpiUserCookie)

    let userData
    try {
      // Handle both URL-encoded and plain JSON
      const decodedCookie = decodeURIComponent(trpiUserCookie)
      console.log('🔍 Decoded cookie:', decodedCookie)
      userData = JSON.parse(decodedCookie)
      console.log('🔍 Parsed user data:', userData)
    } catch (parseError) {
      console.log('❌ Error parsing user cookie:', parseError)
      console.log('🔍 Raw cookie value:', trpiUserCookie)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { session_token } = userData
    if (!session_token) {
      console.log('❌ No session token in cookie')
      return NextResponse.json({ error: 'No session token' }, { status: 401 })
    }

    console.log('🔍 Validating session token:', session_token)

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate session using direct SQL query instead of database function
    console.log('🔍 Making database query to validate session...')
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        id,
        user_id,
        session_token,
        expires_at,
        users!inner (
          id,
          email,
          full_name,
          user_type,
          is_verified,
          is_active,
          credits,
          package_type
        )
      `)
      .eq('session_token', session_token)
      .gt('expires_at', new Date().toISOString())
      .single()

    console.log('🔍 Session query result:', { sessionData, sessionError })

    if (sessionError || !sessionData) {
      console.log('❌ Session validation failed:', sessionError?.message)
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const user = sessionData.users[0]
    console.log('✅ Session validated for user:', user.email)

    // Update last accessed time
    await supabase
      .from('user_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('session_token', session_token)

    const responseData = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        is_verified: user.is_verified,
        is_active: user.is_active,
        credits: user.credits,
        package_type: user.package_type
      }
    }

    console.log('✅ Returning user data:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ /auth/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
