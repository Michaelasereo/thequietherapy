import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🔍 GET /therapist/me called')
  
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

    const trpiTherapistUserCookie = cookies['trpi_therapist_user']
    if (!trpiTherapistUserCookie) {
      console.log('❌ No trpi_therapist_user cookie found')
      console.log('🔍 Available cookies:', Object.keys(cookies))
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('🔍 Found trpi_therapist_user cookie:', trpiTherapistUserCookie)

    let userData
    try {
      // Handle both URL-encoded and plain JSON
      const decodedCookie = decodeURIComponent(trpiTherapistUserCookie)
      console.log('🔍 Decoded cookie:', decodedCookie)
      userData = JSON.parse(decodedCookie)
      console.log('🔍 Parsed user data:', userData)
    } catch (parseError) {
      console.log('❌ Error parsing user cookie:', parseError)
      console.log('🔍 Raw cookie value:', trpiTherapistUserCookie)
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

    // Validate session using direct SQL query
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
          user_type
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

    // Check if user is a therapist
    if (sessionData.users.user_type !== 'therapist') {
      console.log('❌ User is not a therapist:', sessionData.users.user_type)
      return NextResponse.json({ error: 'Access denied - therapist only' }, { status: 403 })
    }

    // Get therapist enrollment data
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', sessionData.users.email)
      .single()

    if (therapistError || !therapistData) {
      console.log('❌ Therapist enrollment not found:', therapistError?.message)
      return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
    }

    const therapist = therapistData
    console.log('✅ Session validated for therapist:', therapist.email)

    // Update last accessed time
    await supabase
      .from('user_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('session_token', session_token)

    const responseData = {
      success: true,
      therapist: {
        id: therapist.id,
        email: therapist.email,
        full_name: therapist.full_name,
        phone: therapist.phone,
        specialization: therapist.specialization,
        languages: therapist.languages,
        status: therapist.status,
        is_active: therapist.is_active,
        hourly_rate: therapist.hourly_rate,
        bio: therapist.bio
      }
    }

    console.log('✅ Returning therapist data:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ /therapist/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
