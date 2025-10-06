"use client"

import { useEffect, useState } from 'react'

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

export class ClientSessionManager {
  private static readonly COOKIE_NAME = 'quiet_session'

  /**
   * Get session data from cookie (client-side)
   */
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const cookies = document.cookie.split(';')
      const sessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${this.COOKIE_NAME}=`)
      )

      if (!sessionCookie) {
        return null
      }

      const token = sessionCookie.split('=')[1]
      if (!token) {
        return null
      }

      // Decode JWT token (client-side validation)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const payload = JSON.parse(atob(parts[1]))
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
      console.error('Client session validation error:', error)
      return null
    }
  }

  /**
   * Clear session cookie (client-side)
   */
  static clearSession(): void {
    if (typeof window === 'undefined') {
      return
    }

    document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: SessionData['role']): boolean {
    const session = this.getSession()
    return session?.role === role
  }

  /**
   * Get user type from session
   */
  static getUserType(): string | null {
    const session = this.getSession()
    return session?.user_type || null
  }
}

/**
 * React hook for session management
 */
export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionData = ClientSessionManager.getSession()
    setSession(sessionData)
    setLoading(false)
  }, [])

  const clearSession = () => {
    ClientSessionManager.clearSession()
    setSession(null)
  }

  return {
    session,
    loading,
    isAuthenticated: !!session,
    clearSession
  }
}