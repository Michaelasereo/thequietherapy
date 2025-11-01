import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Safe JWT_SECRET access for Edge Functions compatibility
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
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

export class ServerSessionManager {
  private static readonly COOKIE_NAME = 'quiet_session'
  private static readonly COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

  /**
   * Create a new session and set the cookie
   */
  static async createSession(
    userData: {
      id: string
      email: string
      name: string
      user_type: string
      is_verified?: boolean
      is_active?: boolean
    },
    response?: NextResponse
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + this.COOKIE_MAX_AGE

    // Determine role from user_type
    const role = userData.user_type as 'individual' | 'therapist' | 'partner' | 'admin'

    const sessionData: SessionData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role,
      user_type: userData.user_type,
      is_verified: userData.is_verified ?? true,
      is_active: userData.is_active ?? true,
    }

    // Create JWT token
    const token = await new SignJWT(sessionData as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(getJWTSecret())

    // Set cookie with explicit domain for production
    const cookieOptions = {
      name: this.COOKIE_NAME,
      value: token,
      maxAge: this.COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'thequietherapy.live' : undefined,
    }

    if (response) {
      response.cookies.set(cookieOptions)
    } else {
      const cookieStore = await cookies()
      cookieStore.set(cookieOptions)
    }

    return token
  }

  /**
   * Get session data from cookie (server-side)
   */
  static async getSession(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get(this.COOKIE_NAME)

      if (!sessionCookie) {
        return null
      }

      const { payload } = await jwtVerify(sessionCookie.value, getJWTSecret())
      return payload as any as SessionData
    } catch (error) {
      // Session expired or invalid - this is expected behavior
      return null
    }
  }

  /**
   * Validate session token (middleware-safe, Edge-compatible)
   */
  static validateSession(token: string): SessionData | null {
    try {
      // Decode JWT without verification for middleware performance
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      // Decode base64 in Edge-compatible way
      const base64Url = parts[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      
      // Convert base64 to bytes then to string (Edge-compatible)
      let jsonPayload: string
      try {
        // Try Node.js Buffer first (server-side)
        if (typeof Buffer !== 'undefined') {
          jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
        } else {
          // Edge Runtime: decode base64 manually
          const binaryString = base64
            .split('')
            .map(char => String.fromCharCode(
              'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(char)
            ))
            .join('')
          jsonPayload = decodeURIComponent(escape(binaryString))
        }
      } catch {
        return null
      }
      
      const payload = JSON.parse(jsonPayload)
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
   * Clear session cookie
   */
  static async clearSession(response?: NextResponse): Promise<void> {
    const cookieOptions = {
      name: this.COOKIE_NAME,
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'thequietherapy.live' : undefined,
    }

    if (response) {
      response.cookies.set(cookieOptions)
    } else {
      const cookieStore = await cookies()
      cookieStore.set(cookieOptions)
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: SessionData['role']): Promise<boolean> {
    const session = await this.getSession()
    return session?.role === role
  }

  /**
   * Get user type from session
   */
  static async getUserType(): Promise<string | null> {
    const session = await this.getSession()
    return session?.user_type || null
  }
}
