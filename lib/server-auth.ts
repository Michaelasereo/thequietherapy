import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { ServerSessionManager } from './server-session-manager'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Short-lived session cache to reduce database load
const sessionCache = new Map<string, { session: ServerSession; expiry: number }>()
const CACHE_TTL_MS = 10_000 // 10 seconds - balance between performance and security

export interface ServerSession {
  user: {
    id: string
    email: string
    full_name: string
    user_type: 'individual' | 'therapist' | 'partner' | 'admin'
    is_verified: boolean
    is_active: boolean
  }
  session_token: string
  expires_at: Date
}

/**
 * Securely verify server-side session from HTTP-only cookie
 * This replaces the insecure cookie parsing in API routes
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies()
    
    // Try different cookie names based on user type
    // Priority: unified session > specific user types
    const cookieNames = [
      'quiet_session', // Unified session cookie (highest priority)
      'quiet_therapist_user',
      'quiet_partner_user', 
      'quiet_admin_user',
      'quiet_individual_user',
      'quiet_user' // Legacy cookie name
    ]
    
    let userCookie = null
    let cookieData = null
    
    for (const cookieName of cookieNames) {
      userCookie = cookieStore.get(cookieName)
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 DEBUG: Checking cookie:', cookieName, userCookie ? 'FOUND' : 'NOT FOUND')
        }
      if (userCookie) {
        try {
          // Handle unified session cookie (JWT token) differently
          if (cookieName === 'quiet_session') {
            // This is a JWT token, not JSON data
            const { jwtVerify } = await import('jose')
            if (!process.env.JWT_SECRET) {
              throw new Error('JWT_SECRET environment variable is required')
            }
            const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
            const { payload } = await jwtVerify(userCookie.value, JWT_SECRET)
            
            // Convert JWT payload to expected format
            cookieData = {
              session_token: userCookie.value,
              id: payload.id,
              email: payload.email,
              full_name: payload.name,
              user_type: payload.user_type || payload.role,
              is_verified: payload.is_verified,
              is_active: payload.is_active
            }
            if (process.env.NODE_ENV !== 'production') {
              console.log('🔍 DEBUG: Parsed JWT session data')
            }
            break
          } else {
            // Handle legacy JSON cookies
            cookieData = JSON.parse(decodeURIComponent(userCookie.value))
            if (process.env.NODE_ENV !== 'production') {
              console.log('🔍 DEBUG: Parsed cookie data')
            }
            break
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 DEBUG： Failed to parse cookie:', cookieName)
          }
          continue
        }
      }
    }
    
    if (!cookieData) {
      return null
    }

    // If this is a unified session (JWT), we can trust it directly
    if (cookieData.id && cookieData.email) {
      console.log('✅ Using unified session data directly')
      const session: ServerSession = {
        user: {
          id: cookieData.id,
          email: cookieData.email,
          full_name: cookieData.full_name,
          user_type: cookieData.user_type,
          is_verified: cookieData.is_verified,
          is_active: cookieData.is_active
        },
        session_token: cookieData.session_token || 'unified-session',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
      return session
    }

    // Fallback to database verification for legacy sessions
    if (!cookieData.session_token) {
      return null
    }

    const sessionToken = cookieData.session_token

    // Check cache first for performance
    const cached = sessionCache.get(sessionToken)
    if (cached && cached.expiry > Date.now()) {
      console.log('✅ Session loaded from cache')
      return cached.session
    }

    // Verify the session token against the database
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 DEBUG: Looking for session token')
    }
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        session_token,
        expires_at,
        users (
          id,
          email,
          full_name,
          user_type,
          is_verified,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .single()

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 DEBUG: Session query result')
    }

    if (sessionError || !sessionData) {
      console.log('❌ Invalid session token:', sessionError)
      // Remove from cache if it was invalid
      sessionCache.delete(sessionToken)
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at)
    if (expiresAt < new Date()) {
      console.log('❌ Session expired')
      // Clean up expired session and cache
      sessionCache.delete(sessionToken)
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)
      return null
    }

    // Create session object
    const session: ServerSession = {
      user: {
        id: (sessionData.users as any).id,
        email: (sessionData.users as any).email,
        full_name: (sessionData.users as any).full_name,
        user_type: (sessionData.users as any).user_type,
        is_verified: (sessionData.users as any).is_verified,
        is_active: (sessionData.users as any).is_active
      },
      session_token: sessionData.session_token,
      expires_at: expiresAt
    }

    // Cache the validated session
    sessionCache.set(sessionToken, {
      session,
      expiry: Date.now() + CACHE_TTL_MS
    })

    // Update last accessed time (async, don't wait)
    supabase
      .from('user_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .then((result) => {
        if (result.error) {
          console.warn('⚠️ Failed to update session access time:', result.error)
        } else {
          console.log('✅ Session access time updated')
        }
      })

    return session

  } catch (error) {
    console.error('❌ Error verifying server session:', error)
    return null
  }
}

/**
 * Require authentication and optionally specific user type
 * Throws redirect if not authenticated or wrong user type
 */
export async function requireAuth(allowedUserTypes?: string[]): Promise<ServerSession> {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }
  
  if (!session.user.is_active) {
    redirect('/account-disabled')
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(session.user.user_type)) {
    redirect('/unauthorized')
  }
  
  return session
}

/**
 * Require specific user type for API routes
 * Returns error response if not authorized
 */
export async function requireApiAuth(allowedUserTypes?: string[]): Promise<{ session: ServerSession } | { error: Response }> {
  // Try unified session first
  const unifiedSession = await SessionManager.getSession()
  
  if (unifiedSession) {
    // Convert unified session to ServerSession format
    const session: ServerSession = {
      user: {
        id: unifiedSession.id,
        email: unifiedSession.email,
        full_name: unifiedSession.name,
        user_type: unifiedSession.user_type as 'individual' | 'therapist' | 'partner' | 'admin',
        is_verified: unifiedSession.is_verified,
        is_active: unifiedSession.is_active
      },
      session_token: unifiedSession.session_token || '',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
    
    if (!session.user.is_active) {
      return { 
        error: new Response(
          JSON.stringify({ error: 'Account disabled' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    if (allowedUserTypes && !allowedUserTypes.includes(session.user.user_type)) {
      return { 
        error: new Response(
          JSON.stringify({ error: 'Insufficient permissions' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    return { session }
  }
  
  // Fallback to old session system
  const session = await getServerSession()
  
  if (!session) {
    return { 
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  if (!session.user.is_active) {
    return { 
      error: new Response(
        JSON.stringify({ error: 'Account disabled' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(session.user.user_type)) {
    return { 
      error: new Response(
        JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { session }
}
