"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type AdminUser = {
  id: string
  email: string
  name: string
  role: "admin"
  session_token: string
}

type AdminContextType = {
  adminUser: AdminUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
  validateSession: () => Promise<boolean>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Validate session from API call
  const validateSession = async (): Promise<boolean> => {
    console.log('🔍 AdminContext: validateSession called')
    try {
      console.log('🔍 AdminContext: Calling /api/auth/me for validation...')
      
      // Use the unified auth API for validation
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      console.log('🔍 AdminContext: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 AdminContext: API response data:', data)
        
        if (data.success && data.user && data.user.user_type === 'admin') {
          console.log('✅ AdminContext: Admin session validated successfully')
          setAdminUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name || data.user.email.split('@')[0],
            role: 'admin',
            session_token: data.user.session_token || 'admin-session'
          })
          setIsAuthenticated(true)
          return true
        }
      }
      
      console.log('❌ AdminContext: Session validation failed')
      setAdminUser(null)
      setIsAuthenticated(false)
      return false
      
    } catch (error) {
      console.error('❌ AdminContext: Session validation error:', error)
      setAdminUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 AdminContext: Initializing authentication...')
      
      // Validate session with server (no need to check old cookies)
      await validateSession()
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const logout = () => {
    console.log('🔍 AdminContext: Logging out...')
    // Clear unified session cookie
    Cookies.remove("quiet_session")
    setAdminUser(null)
    setIsAuthenticated(false)
    router.push("/admin/login")
  }

  return (
    <AdminContext.Provider value={{ 
      adminUser, 
      loading, 
      isAuthenticated, 
      logout, 
      validateSession 
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
