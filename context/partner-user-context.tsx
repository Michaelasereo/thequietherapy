"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type PartnerUser = {
  id: string
  name: string
  email: string
  role: "partner"
  organization_name?: string
  session_token?: string
}

type PartnerUserContextType = {
  partnerUser: PartnerUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
  validateSession: () => Promise<boolean>
}

const PartnerUserContext = createContext<PartnerUserContextType | undefined>(undefined)

export function PartnerUserProvider({ children }: { children: ReactNode }) {
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Validate session from cookie
  const validateSession = async (): Promise<boolean> => {
    console.log('🔍 PartnerUserContext: validateSession called')
    try {
      const userCookie = Cookies.get('trpi_partner_user')
      console.log('🔍 PartnerUserContext: User cookie from js-cookie:', userCookie ? 'Found' : 'Not found')
      
      if (!userCookie) {
        console.log('🔍 PartnerUserContext: No user cookie found')
        return false
      }
      
      let userData
      try {
        userData = JSON.parse(userCookie)
        console.log('🔍 PartnerUserContext: Parsed user data:', {
          id: userData.id,
          email: userData.email,
          hasSessionToken: !!userData.session_token
        })
      } catch (parseError) {
        console.error('❌ PartnerUserContext: Error parsing user cookie:', parseError)
        return false
      }
      
      const sessionToken = userData.session_token
      if (!sessionToken) {
        console.log('🔍 PartnerUserContext: No session token in cookie')
        return false
      }

      console.log('🔍 PartnerUserContext: Calling /api/partner/me for validation...')
      // Use direct API call to /api/partner/me for validation
      const response = await fetch('/api/partner/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      console.log('🔍 PartnerUserContext: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 PartnerUserContext: API response data:', data)
        
        if (data.success) {
          console.log('✅ PartnerUserContext: Session validated successfully')
          setPartnerUser({
            id: data.partner.id,
            name: data.partner.full_name,
            email: data.partner.email,
            role: 'partner',
            organization_name: data.partner.company_name
          })
          setIsAuthenticated(true)
          return true
        }
      }
      
      console.log('❌ PartnerUserContext: Session validation failed')
      Cookies.remove('trpi_partner_user')
      setPartnerUser(null)
      setIsAuthenticated(false)
      return false
    } catch (error) {
      console.error('❌ PartnerUserContext: Session validation error:', error)
      Cookies.remove('trpi_partner_user')
      setPartnerUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('🔍 PartnerUserContext: useEffect triggered - initializing auth')
    const initAuth = async () => {
      try {
        console.log('🔍 PartnerUserContext: Starting auth initialization...')
        // Try multiple times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`🔍 PartnerUserContext: Auth attempt ${attempt}/3`)
          // Add delay that increases with each attempt
          const delay = attempt * 500 // 500ms, 1000ms, 1500ms
          console.log(`🔍 PartnerUserContext: Waiting ${delay}ms before attempt ${attempt}`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const isValid = await validateSession()
          console.log(`🔍 PartnerUserContext: Attempt ${attempt} result:`, isValid)
          
          if (isValid) {
            console.log('✅ PartnerUserContext: Auth initialization successful')
            break
          }
        }
      } catch (error) {
        console.error('❌ PartnerUserContext: Auth initialization error:', error)
      } finally {
        console.log('🔍 PartnerUserContext: Setting loading to false')
        setLoading(false)
      }
    }
    
    // Start initialization immediately
    initAuth()
  }, [])

  const logout = () => {
    Cookies.remove("trpi_partner_user")
    setPartnerUser(null)
    setIsAuthenticated(false)
    router.push("/partner/auth")
  }

  return (
    <PartnerUserContext.Provider value={{ 
      partnerUser, 
      loading, 
      isAuthenticated, 
      logout, 
      validateSession 
    }}>
      {children}
    </PartnerUserContext.Provider>
  )
}

export function usePartnerUser() {
  const context = useContext(PartnerUserContext)
  if (context === undefined) {
    throw new Error("usePartnerUser must be used within a PartnerUserProvider")
  }
  return context
}
