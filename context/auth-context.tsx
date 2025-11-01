"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { ClientSessionManager } from '@/lib/client-session-manager'

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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'individual' | 'therapist' | 'partner' | 'admin' | null>(null)
  const isValidatingRef = useRef(false)
  const lastValidationRef = useRef<number>(0)
  const failedValidationCountRef = useRef<number>(0)

  // Validate session using SessionManager
  const validateSession = async (retryCount = 0, forceRefresh = false): Promise<boolean> => {
    // Prevent concurrent validation calls (unless forcing refresh)
    if (isValidatingRef.current && !forceRefresh) {
      return !!user
    }

    // Cache validation results for 10 seconds (unless forcing refresh)
    const now = Date.now()
    if (!forceRefresh && now - lastValidationRef.current < 10000 && user) {
      return true
    }

    // Stop retrying after 3 failed attempts to prevent infinite loops
    if (!forceRefresh && failedValidationCountRef.current >= 3) {
      isValidatingRef.current = false
      return false
    }

    isValidatingRef.current = true
    
    try {
      // Check session using ClientSessionManager
      const sessionData = await ClientSessionManager.getSession()
      
      if (sessionData) {
        // Convert session data to UserProfile format
        const userProfile: UserProfile = {
          id: sessionData.id,
          email: sessionData.email,
          full_name: sessionData.full_name || sessionData.name || sessionData.email.split('@')[0],
          user_type: sessionData.user_type,
          credits: 0, // Default value
          package_type: 'basic', // Default value
          is_verified: sessionData.is_verified,
          is_active: sessionData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          session_token: sessionData.session_token
        }
        
        setUser(userProfile)
        setUserType(sessionData.user_type as 'individual' | 'therapist' | 'partner' | 'admin')
        lastValidationRef.current = now
        isValidatingRef.current = false
        failedValidationCountRef.current = 0 // Reset on success
        return true
      } else {
        setUser(null)
        setUserType(null)
        isValidatingRef.current = false
        failedValidationCountRef.current++
        return false
      }
      
    } catch (error: unknown) {
      setUser(null)
      setUserType(null)
      isValidatingRef.current = false
      failedValidationCountRef.current++
      return false
    }
  }

  // Refresh user data (force a fresh fetch from the API)
  const refreshUser = async () => {
    // Force a fresh validation, bypassing the cache
    const isValid = await validateSession(0, true)
    if (!isValid) {
      setUser(null)
      setUserType(null)
    }
  }

  // Login function - sends magic link
  const login = async (email: string, userType: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          user_type: userType,
          type: 'login'
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Signup function - sends magic link
  const signup = async (email: string, fullName: string, userType: 'individual' | 'therapist' | 'partner' | 'admin'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          user_type: userType,
          type: 'signup',
          metadata: {
            first_name: fullName
          }
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Logout function - clears session
  const logout = async () => {
    try {
      // Clear session using ClientSessionManager
      ClientSessionManager.clearSession()
      
      // Clear local state
      setUser(null)
      setUserType(null)
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      
      // Fallback: clear local state and redirect
      setUser(null)
      setUserType(null)
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Initialize auth state with magic link sessions
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      
      try {
        await validateSession()
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setUserType(null)
      }
      
      setLoading(false)
    }

    initAuth()
    
    // Set up periodic session refresh (every 30 minutes, less aggressive)
    const refreshInterval = setInterval(() => {
      if (!isValidatingRef.current && user) {
        validateSession().catch(() => {
          // Session refresh failed (non-critical)
        })
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    return () => {
      clearInterval(refreshInterval)
    }
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
