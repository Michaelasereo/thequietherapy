import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ServerSessionManager } from '@/lib/server-session-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Log incoming request for debugging
    const cookieHeader = request.cookies.get('quiet_session')
    console.log('🔍 /api/auth/me called')
    console.log('   Cookie present in request:', !!cookieHeader)
    console.log('   Cookie value length:', cookieHeader?.value?.length || 0)
    const allCookies = request.cookies.getAll()
    console.log('   All cookies:', allCookies.map(c => c.name))
    
    // Try unified session first
    const unifiedSession = await ServerSessionManager.getSession()
    
    console.log('   Session found:', !!unifiedSession)
    if (!unifiedSession) {
      console.log('   ❌ No session - checking cookie store directly...')
      const cookieStore = await import('next/headers').then(m => m.cookies())
      const directCookie = cookieStore.get('quiet_session')
      console.log('   Direct cookie check:', !!directCookie)
    }
    
    if (unifiedSession) {
      
      // Fetch fresh user data from the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, user_type, is_verified, is_active')
        .eq('id', unifiedSession.id)
        .single()
      
      if (userError || !userData) {
        // Fallback to session data if database query fails
        return NextResponse.json({
          success: true,
          user: {
            id: unifiedSession.id,
            email: unifiedSession.email,
            full_name: unifiedSession.name,
            user_type: unifiedSession.role,
            is_verified: unifiedSession.is_verified,
            is_active: unifiedSession.is_active,
            is_authenticated: true
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.full_name || userData.email.split('@')[0],
          full_name: userData.full_name,
          user_type: userData.user_type,
          role: userData.user_type,
          is_verified: userData.is_verified,
          is_active: userData.is_active,
          is_authenticated: true
        }
      })
    }
    
    // No valid session found
    return NextResponse.json({ error: 'No session found' }, { status: 401 })

  } catch (error) {
    console.error('❌ Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
