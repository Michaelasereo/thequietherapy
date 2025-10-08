import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/auth/me called')
  
  try {
    // Try unified session first
    const unifiedSession = await ServerSessionManager.getSession()
    
    if (unifiedSession) {
      console.log('✅ Using unified session:', {
        id: unifiedSession.id,
        email: unifiedSession.email,
        role: unifiedSession.role
      })
      
      return NextResponse.json({
        success: true,
        user: {
          id: unifiedSession.id,
          email: unifiedSession.email,
          full_name: unifiedSession.name,
          user_type: unifiedSession.role,
          is_authenticated: true
        }
      })
    }
    
    // Fallback to cookie-based session
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Cookie header:', cookieHeader)
    
    if (!cookieHeader) {
      console.log('❌ No cookie header found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Parse cookies
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {} as Record<string, string>)

    console.log('🔍 Parsed cookies:', cookies)

    // Check for different session cookies
    const sessionCookies = [
      'supabase_session',
      'trpi_partner_user',
      'quiet_therapist_user',
      'quiet_admin_user'
    ]

    let userData = null
    let cookieName = null

    for (const cookieName of sessionCookies) {
      const cookieValue = cookies[cookieName]
      if (cookieValue) {
        try {
          const decodedCookie = decodeURIComponent(cookieValue)
          userData = JSON.parse(decodedCookie)
          console.log(`✅ Found session in ${cookieName}:`, userData)
          break
        } catch (parseError) {
          console.log(`❌ Error parsing ${cookieName}:`, parseError)
          continue
        }
      }
    }

    if (!userData) {
      console.log('❌ No valid session cookie found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Extract user information based on cookie type
    let userInfo = null
    
    if (userData.user && userData.session) {
      // Supabase session format
      userInfo = {
        id: userData.user.id,
        email: userData.user.email,
        full_name: userData.user.name || userData.user.full_name,
        user_type: userData.user.user_type || 'individual',
        is_authenticated: true
      }
    } else if (userData.id && userData.email) {
      // Direct user data format
      userInfo = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || userData.name,
        user_type: userData.user_type || 'individual',
        is_authenticated: true
      }
    }

    if (!userInfo) {
      console.log('❌ Could not extract user info from session')
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

    console.log('✅ Returning user info:', userInfo)
    return NextResponse.json({
      success: true,
      user: userInfo
    })

  } catch (error) {
    console.error('❌ Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
