import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🚪 POST /auth/logout called')
  
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      console.log('❌ No cookie header found')
      return NextResponse.json({ success: true, message: 'Already logged out' })
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const trpiUserCookie = cookies['trpi_user']
    if (!trpiUserCookie) {
      console.log('❌ No trpi_user cookie found')
      return NextResponse.json({ success: true, message: 'Already logged out' })
    }

    let userData
    try {
      userData = JSON.parse(decodeURIComponent(trpiUserCookie))
    } catch (parseError) {
      console.log('❌ Error parsing user cookie:', parseError)
      return NextResponse.json({ success: true, message: 'Already logged out' })
    }

    const { session_token } = userData
    if (!session_token) {
      console.log('❌ No session token in cookie')
      return NextResponse.json({ success: true, message: 'Already logged out' })
    }

    console.log('🔍 Invalidating session token...')

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Invalidate session using database function
    const { data: invalidated, error: sessionError } = await supabase
      .rpc('invalidate_session', {
        p_session_token: session_token
      })

    if (sessionError) {
      console.log('❌ Session invalidation error:', sessionError.message)
      // Continue with logout even if session invalidation fails
    } else {
      console.log('✅ Session invalidated successfully')
    }

    // Create response with cleared cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the session cookie
    response.cookies.set("trpi_user", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log('✅ Logout completed')
    return response

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
