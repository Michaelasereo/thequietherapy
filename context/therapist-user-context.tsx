"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type TherapistUser = {
  id: string
  name: string
  email: string
  role: "therapist"
  specialization?: string[]
  licenseNumber?: string
  phone?: string
  languages?: string[]
  bio?: string
  hourlyRate?: number
  status?: string
  // Add other therapist-specific properties as needed
}

type TherapistUserContextType = {
  therapistUser: TherapistUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
  validateSession: () => Promise<boolean>
}

const TherapistUserContext = createContext<TherapistUserContextType | undefined>(undefined)

export function TherapistUserProvider({ children }: { children: ReactNode }) {
  const [therapistUser, setTherapistUser] = useState<TherapistUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Validate session from cookie
  const validateSession = async (): Promise<boolean> => {
    console.log('🔍 TherapistUserContext: validateSession called')
    try {
      const userCookie = Cookies.get('trpi_therapist_user')
      console.log('🔍 TherapistUserContext: User cookie from js-cookie:', userCookie ? 'Found' : 'Not found')
      
      if (!userCookie) {
        console.log('🔍 TherapistUserContext: No user cookie found')
        return false
      }
      
      let userData
      try {
        userData = JSON.parse(userCookie)
        console.log('🔍 TherapistUserContext: Parsed user data:', {
          id: userData.id,
          email: userData.email,
          hasSessionToken: !!userData.session_token
        })
      } catch (parseError) {
        console.error('❌ TherapistUserContext: Error parsing user cookie:', parseError)
        return false
      }
      
      const sessionToken = userData.session_token
      if (!sessionToken) {
        console.log('🔍 TherapistUserContext: No session token in cookie')
        return false
      }

      console.log('🔍 TherapistUserContext: Calling /api/therapist/me for validation...')
      // Use direct API call to /api/therapist/me for validation
      const response = await fetch('/api/therapist/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      console.log('🔍 TherapistUserContext: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 TherapistUserContext: API response data:', data)
        
        if (data.success) {
          console.log('✅ TherapistUserContext: Session validated successfully')
          setTherapistUser({
            id: data.therapist.id,
            name: data.therapist.full_name,
            email: data.therapist.email,
            role: 'therapist',
            specialization: data.therapist.specialization,
            licenseNumber: data.therapist.license_number,
            phone: data.therapist.phone,
            languages: data.therapist.languages,
            bio: data.therapist.bio,
            hourlyRate: data.therapist.hourly_rate,
            status: data.therapist.status
          })
          setIsAuthenticated(true)
          return true
        }
      }
      
      console.log('❌ TherapistUserContext: Session validation failed')
      Cookies.remove('trpi_therapist_user')
      setTherapistUser(null)
      setIsAuthenticated(false)
      return false
    } catch (error) {
      console.error('❌ TherapistUserContext: Session validation error:', error)
      Cookies.remove('trpi_therapist_user')
      setTherapistUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('🔍 TherapistUserContext: useEffect triggered - initializing auth')
    const initAuth = async () => {
      try {
        console.log('🔍 TherapistUserContext: Starting auth initialization...')
        // Try multiple times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`🔍 TherapistUserContext: Auth attempt ${attempt}/3`)
          // Add delay that increases with each attempt
          const delay = attempt * 500 // 500ms, 1000ms, 1500ms
          console.log(`🔍 TherapistUserContext: Waiting ${delay}ms before attempt ${attempt}`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const isValid = await validateSession()
          console.log(`🔍 TherapistUserContext: Attempt ${attempt} result:`, isValid)
          
          if (isValid) {
            console.log('✅ TherapistUserContext: Auth initialization successful')
            break
          }
        }
      } catch (error) {
        console.error('❌ TherapistUserContext: Auth initialization error:', error)
      } finally {
        console.log('🔍 TherapistUserContext: Setting loading to false')
        setLoading(false)
      }
    }
    
    // Start initialization immediately
    initAuth()
  }, [])

  const logout = () => {
    Cookies.remove("trpi_therapist_user")
    setTherapistUser(null)
    setIsAuthenticated(false)
    router.push("/therapist/login")
  }

  return (
    <TherapistUserContext.Provider value={{ 
      therapistUser, 
      loading, 
      isAuthenticated, 
      logout, 
      validateSession 
    }}>
      {children}
    </TherapistUserContext.Provider>
  )
}

export function useTherapistUser() {
  const context = useContext(TherapistUserContext)
  if (context === undefined) {
    throw new Error("useTherapistUser must be used within a TherapistUserProvider")
  }
  return context
}
