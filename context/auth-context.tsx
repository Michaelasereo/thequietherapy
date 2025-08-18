"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: string
  credits: number
  package_type: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  avatar_url?: string
  session_token?: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  userType: 'individual' | 'therapist' | 'partner' | 'admin' | null
  login: (email: string, userType: 'individual' | 'therapist' | 'partner' | 'admin') => Promise<{ success: boolean; error?: string }>
  signup: (email: string, fullName: string, userType: 'individual' | 'therapist' | 'partner' | 'admin') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  validateSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'individual' | 'therapist' | 'partner' | 'admin' | null>(null)

  // Validate session from cookie
  const validateSession = async (): Promise<boolean> => {
    try {
      // Call the /api/auth/me endpoint which can read HTTP-only cookies server-side
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // This ensures cookies are sent
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          // Determine user type from the user data
          const userType = data.user.user_type as 'individual' | 'therapist' | 'partner' | 'admin'
          setUserType(userType)
          return true
        }
      }
      
      // If we get here, the session is invalid
      setUser(null)
      setUserType(null)
      return false
      
    } catch (error: unknown) {
      console.error('Session validation error:', error)
      setUser(null)
      setUserType(null)
      return false
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    const isValid = await validateSession()
    if (!isValid) {
      setUser(null)
      setUserType(null)
    }
  }

  // Login function
  const login = async (email: string, userType: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userType })
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Signup function
  const signup = async (email: string, fullName: string, userType: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fullName, userType })
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout API error:', error)
    }

    // Clear all auth cookies
    const cookieKeys: string[] = [
      'trpi_individual_user',
      'trpi_therapist_user',
      'trpi_partner_user',
      'trpi_admin_user'
    ]
    cookieKeys.forEach((name) => Cookies.remove(name))
    
    setUser(null)
    setUserType(null)
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      await validateSession()
      setLoading(false)
    }

    initAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    userType,
    login,
    signup,
    logout,
    refreshUser,
    validateSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
