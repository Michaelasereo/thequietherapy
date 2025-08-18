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
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {} as Record<string, string>)

    // Check for user type specific cookies first
    const cookieNames = ['trpi_individual_user', 'trpi_therapist_user', 'trpi_partner_user', 'trpi_admin_user']
    let userCookie = null
    let detectedUserType: 'individual' | 'therapist' | 'partner' | 'admin' | null = null

    for (const cookieName of cookieNames) {
      const cookie = cookies[cookieName]
      if (cookie) {
        userCookie = cookie
        detectedUserType = cookieName.replace('trpi_', '').replace('_user', '') as 'individual' | 'therapist' | 'partner' | 'admin'
        console.log('🔍 Found user cookie for logout:', cookieName)
        break
      }
    }

    // Fallback to generic trpi_user cookie
    if (!userCookie) {
      userCookie = cookies['trpi_user']
      if (userCookie) {
        console.log('🔍 Found generic trpi_user cookie for logout')
      }
    }

    if (!userCookie) {
      console.log('❌ No user cookie found')
      return NextResponse.json({ success: true, message: 'Already logged out' })
    }

    let userData
    try {
      userData = JSON.parse(decodeURIComponent(userCookie))
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

    // Delete session from user_sessions table
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', session_token)

    if (sessionError) {
      console.log('❌ Session deletion error:', sessionError.message)
      // Continue with logout even if session deletion fails
    } else {
      console.log('✅ Session deleted successfully')
    }

    // Create response with cleared cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear all possible session cookies
    const cookieKeys = [
      'trpi_individual_user',
      'trpi_therapist_user', 
      'trpi_partner_user',
      'trpi_admin_user',
      'trpi_user'
    ]

    cookieKeys.forEach((cookieName) => {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 0, // Expire immediately
        path: "/",
      })
    })

    console.log('✅ Logout completed')
    return response

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
