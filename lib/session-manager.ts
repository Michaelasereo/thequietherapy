import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Safe JWT_SECRET access for Edge Functions compatibility
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionData {
  id: string
  email: string
  name: string
  role: 'individual' | 'therapist' | 'partner' | 'admin'
  user_type: string
  is_verified: boolean
  is_active: boolean
  session_token?: string
}

export class SessionManager {
  private static readonly COOKIE_NAME = 'quiet_session'
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours (healthcare-grade security)
  private static readonly REFRESH_WINDOW = 6 * 60 * 60 * 1000 // Refresh if < 6 hours left
  private static readonly GRACE_PERIOD = 30 * 60 * 1000 // 30 minutes grace after expiry
  private static readonly ABSOLUTE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days absolute maximum

  /**
   * Create a new session and set the cookie
   */
  static async createSession(sessionData: SessionData): Promise<string> {
    const token = await new SignJWT(sessionData as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Healthcare-grade: 24 hours
      .sign(getJWTSecret())

    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.MAX_AGE, // 24 hours
      path: '/'
    })

    return token
  }

  /**
   * Get the current session from the cookie
   */
  static async getSession(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get(this.COOKIE_NAME)?.value

      if (!token) {
        console.log('🔍 No session cookie found')
        return null
      }

      // Removed sensitive cookie logging for security

      const { payload } = await jwtVerify(token, getJWTSecret())
      const sessionData = payload as any as SessionData

      // Basic validation
      if (!sessionData.id || !sessionData.email) {
        console.error('❌ Invalid session data structure')
        return null
      }

      console.log('✅ Session validated for user:', sessionData.email)
      return sessionData
    } catch (error: any) {
      // Distinguish between expired and invalid tokens
      if (error?.code === 'ERR_JWT_EXPIRED' || error?.message?.includes('exp')) {
        console.log('⏰ Session token expired')
      } else {
        console.error('❌ Session retrieval error:', error)
      }
      return null
    }
  }

  /**
   * Get session with automatic refresh if nearing expiration
   */
  static async getSessionWithRefresh(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get(this.COOKIE_NAME)?.value

      if (!token) {
        console.log('🔍 No session cookie found')
        return null
      }

      try {
        const { payload } = await jwtVerify(token, getJWTSecret())
        const sessionData = payload as any as SessionData

        // Check if token is nearing expiration (less than 6 hours remaining)
        const expiryTime = (payload.exp || 0) * 1000
        const timeUntilExpiry = expiryTime - Date.now()

        if (timeUntilExpiry < this.REFRESH_WINDOW && timeUntilExpiry > 0) {
          console.log('🔄 Session nearing expiration, refreshing...')
          // Refresh the session
          await this.createSession(sessionData)
          console.log('✅ Session refreshed successfully')
        }

        return sessionData
      } catch (error: any) {
        // If token is expired but within grace period (30 minutes), allow refresh
        if (error?.code === 'ERR_JWT_EXPIRED' || error?.message?.includes('exp')) {
          console.log('⏰ Token expired, checking if within grace period...')
          
          try {
            // Decode without verification to check expiry time
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const expiryTime = decoded.exp * 1000
            const timeSinceExpiry = Date.now() - expiryTime
            
            // Allow refresh if expired less than 30 minutes ago (grace period)
            if (timeSinceExpiry < this.GRACE_PERIOD && timeSinceExpiry > 0) {
              console.log('✅ Within 30-minute grace period, refreshing session...')
              const sessionData = decoded as SessionData
              await this.createSession(sessionData)
              return sessionData
            } else {
              console.log('❌ Expired beyond grace period, cannot refresh')
            }
          } catch (decodeError) {
            console.error('❌ Error decoding expired token:', decodeError)
          }
        }
        
        console.error('❌ Session retrieval error:', error)
        return null
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error)
      return null
    }
  }

  /**
   * Get session from request (for API routes)
   */
  static async getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
    try {
      const sessionCookie = request.cookies.get(this.COOKIE_NAME)?.value

      if (!sessionCookie) {
        console.log('🔍 No session cookie found')
        return null
      }

      // Removed sensitive cookie logging for security

      // Verify JWT token
      const { payload } = await jwtVerify(sessionCookie, getJWTSecret())
      const sessionData = payload as any as SessionData

      // Basic validation
      if (!sessionData.id || !sessionData.email) {
        console.error('❌ Invalid session data structure')
        return null
      }

      console.log('✅ Session found for user:', sessionData.email)
      return sessionData

    } catch (error) {
      console.error('❌ Session retrieval error:', error)
      return null
    }
  }

  /**
   * Validate session token (for middleware)
   */
  static validateSession(token: string): SessionData | null {
    try {
      // Decode JWT without verification for middleware performance
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      const sessionData = payload as SessionData

      // Basic validation
      if (!sessionData.id || !sessionData.email) {
        return null
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return null
      }

      return sessionData
    } catch (error) {
      return null
    }
  }

  /**
   * Clear the session cookie
   */
  static async clearSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.COOKIE_NAME)
  }

  /**
   * Clear expired session cookie from request
   */
  static async clearExpiredSession(request: NextRequest): Promise<void> {
    const token = request.cookies.get(this.COOKIE_NAME)?.value
    if (token) {
      try {
        await jwtVerify(token, getJWTSecret())
      } catch (error) {
        // Token is expired or invalid, clear it
        if (error instanceof Error && error.message.includes('exp')) {
          const response = NextResponse.next()
          response.cookies.delete(this.COOKIE_NAME)
          return
        }
      }
    }
  }

  /**
   * Update session data (useful for profile updates)
   */
  static async updateSession(updates: Partial<SessionData>): Promise<SessionData | null> {
    const currentSession = await this.getSession()
    if (!currentSession) {
      return null
    }

    const updatedSession = { ...currentSession, ...updates }
    await this.createSession(updatedSession)
    return updatedSession
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: SessionData['role']): Promise<boolean> {
    const session = await this.getSession()
    return session?.role === role
  }

  /**
   * Require specific role (throws if not authorized)
   */
  static async requireRole(role: SessionData['role']): Promise<SessionData> {
    const session = await this.getSession()
    if (!session || session.role !== role) {
      throw new Error(`Access denied. Required role: ${role}`)
    }
    return session
  }
}

/**
 * Middleware helper for API routes
 */
export async function requireAuth(requiredRole?: SessionData['role']) {
  return async (request: NextRequest) => {
    const session = await SessionManager.getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (requiredRole && session.role !== requiredRole) {
      return NextResponse.json({ error: `Access denied. Required role: ${requiredRole}` }, { status: 403 })
    }

    return { session }
  }
}
