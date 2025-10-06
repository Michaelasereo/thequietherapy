import { NextRequest, NextResponse } from 'next/server'
import { ServerSessionManager } from '@/lib/server-session-manager'
import { UnifiedAuth } from '@/lib/unified-auth'

export async function POST(request: NextRequest) {
  console.log('🚪 POST /auth/logout called')
  
  try {
    // Get session before clearing
    const session = await ServerSessionManager.getSession()
    
    if (session) {
      console.log('🔍 Logging out user:', session.email)
      
      // Use UnifiedAuth for comprehensive logout (clears DB + cookies)
      await UnifiedAuth.logout()
      
      console.log('✅ Comprehensive logout completed')
    } else {
      console.log('⚠️ No session found, clearing cookies anyway')
    }

    // Create response with cleared session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the unified session cookie
    response.cookies.set('quiet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      path: '/',
    })
    
    // Clear legacy cookies
    const legacyCookies = ['quiet_user', 'quiet_therapist', 'quiet_therapist_user']
    legacyCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
      })
    })

    console.log('✅ All logout operations completed')
    return response

  } catch (error) {
    console.error('❌ Logout error:', error)
    
    // Even if there's an error, still clear cookies
    const response = NextResponse.json({
      success: true, // Still return success to not confuse the user
      message: 'Logged out successfully'
    })
    
    response.cookies.set('quiet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    })
    
    return response
  }
}
