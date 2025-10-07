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
  /**
   * Get session data from API
   */
  static async getSession(): Promise<SessionData | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Clear session by calling logout API
   */
  static async clearSession(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: SessionData['role']): Promise<boolean> {
    const session = await this.getSession()
    return session?.role === role
  }
}

/**
 * React hook for session management
 */
export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const sessionData = await ClientSessionManager.getSession()
        setSession(sessionData)
        setError(null)
      } catch (err) {
        setError('Failed to check authentication')
        console.error('Session check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const logout = async () => {
    try {
      await ClientSessionManager.clearSession()
      setSession(null)
      setError(null)
    } catch (err) {
      setError('Failed to logout')
      console.error('Logout error:', err)
    }
  }

  return {
    session,
    loading,
    error,
    logout,
    refetch: () => {
      setLoading(true)
      ClientSessionManager.getSession().then(setSession).finally(() => setLoading(false))
    }
  }
}