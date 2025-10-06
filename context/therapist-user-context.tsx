"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'

interface TherapistProfile {
  id: string
  email: string
  full_name: string
  user_type: 'therapist'
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  avatar_url?: string
  session_token?: string
  // Therapist-specific fields
  specialization?: string
  bio?: string
  experience_years?: number
  license_number?: string
  verification_status?: 'pending' | 'approved' | 'rejected'
}

interface TherapistUserContextType {
  therapist: TherapistProfile | null
  loading: boolean
  isAuthenticated: boolean
  refreshTherapist: () => Promise<void>
  logout: () => Promise<void>
}

const TherapistUserContext = createContext<TherapistUserContextType | undefined>(undefined)

export function TherapistUserProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout: authLogout, refreshUser } = useAuth()
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Refresh therapist data
  const refreshTherapist = useCallback(async () => {
    if (!user || user.user_type !== 'therapist') {
      setTherapist(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch therapist-specific data
      const response = await fetch('/api/therapist/profile', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.therapist) {
          setTherapist(data.therapist)
        } else {
          // Fallback to basic user data
          setTherapist({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: 'therapist',
            is_verified: user.is_verified,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            avatar_url: user.avatar_url,
            session_token: user.session_token
          })
        }
      } else {
        // Fallback to basic user data
        setTherapist({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: 'therapist',
          is_verified: user.is_verified,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          avatar_url: user.avatar_url,
          session_token: user.session_token
        })
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error)
      // Fallback to basic user data
      setTherapist({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: 'therapist',
        is_verified: user.is_verified,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        avatar_url: user.avatar_url,
        session_token: user.session_token
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authLogout()
      setTherapist(null)
    } catch (error) {
      console.error('Error during therapist logout:', error)
    }
  }, [authLogout])

  // Initial load and user changes
  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setTherapist(null)
      setLoading(false)
      return
    }

    if (user.user_type === 'therapist') {
      refreshTherapist()
    } else {
      setTherapist(null)
      setLoading(false)
    }
  }, [user, authLoading, refreshTherapist])

  // Periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!user || user.user_type !== 'therapist') return

    const interval = setInterval(() => {
      refreshTherapist()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, refreshTherapist])

  const value: TherapistUserContextType = {
    therapist,
    loading,
    isAuthenticated: !!therapist,
    refreshTherapist,
    logout
  }

  return (
    <TherapistUserContext.Provider value={value}>
      {children}
    </TherapistUserContext.Provider>
  )
}

export function useTherapistUser(): TherapistUserContextType {
  const context = useContext(TherapistUserContext)
  if (context === undefined) {
    throw new Error('useTherapistUser must be used within a TherapistUserProvider')
  }
  return context
}
