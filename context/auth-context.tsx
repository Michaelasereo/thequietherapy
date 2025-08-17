"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  validateSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Validate session from cookie
  const validateSession = async (): Promise<boolean> => {
    try {
      const userCookie = Cookies.get('trpi_user')
      
      if (!userCookie) {
        return false
      }
      
      let userData
      try {
        userData = JSON.parse(userCookie)
      } catch (parseError) {
        return false
      }
      
      const sessionToken = userData.session_token
      if (!sessionToken) {
        return false
      }

      // Use direct API call to /api/auth/me for validation
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          return true
        }
      }
      
      Cookies.remove('trpi_user')
      return false
    } catch (error) {
      console.error('Session validation error:', error)
      Cookies.remove('trpi_user')
      return false
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    const isValid = await validateSession()
    if (!isValid) {
      setUser(null)
    }
  }

  // Login function
  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Signup function
  const signup = async (email: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fullName }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const userCookie = Cookies.get('trpi_user')
      if (userCookie) {
        const userData = JSON.parse(userCookie)
        const sessionToken = userData.session_token

        if (sessionToken) {
          // Invalidate session in database
          await supabase.rpc('invalidate_session', { p_session_token: sessionToken })
        }
      }

      // Remove cookie
      Cookies.remove('trpi_user')
      setUser(null)
      console.log('User logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Still remove cookie even if database call fails
      Cookies.remove('trpi_user')
      setUser(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try multiple times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          // Add delay that increases with each attempt
          const delay = attempt * 500 // 500ms, 1000ms, 1500ms
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const isValid = await validateSession()
          
          if (isValid) {
            break
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Start initialization immediately
    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser,
      validateSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
