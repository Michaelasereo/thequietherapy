"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

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

  // Validate session from API call (not client-side cookies)
  const validateSession = async (): Promise<boolean> => {
    console.log('🔍 TherapistUserContext: validateSession called')
    try {
      console.log('🔍 TherapistUserContext: Calling /api/therapist/profile for validation...')
      
      // Use the therapist profile API for validation
      const response = await fetch('/api/therapist/profile', {
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
        } else {
          console.log('❌ TherapistUserContext: API returned success: false')
          return false
        }
      } else {
        console.log('❌ TherapistUserContext: API request failed with status:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ TherapistUserContext: Error validating session:', error)
      return false
    }
  }

  // Initialize auth on mount
  useEffect(() => {
    console.log('🔍 TherapistUserContext: useEffect triggered - initializing auth')
    const initializeAuth = async () => {
      console.log('🔍 TherapistUserContext: Starting auth initialization...')
      
      // Try up to 3 times with increasing delays
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔍 TherapistUserContext: Auth attempt ${attempt}/3`)
        
        if (attempt > 1) {
          const delay = attempt * 500
          console.log(`🔍 TherapistUserContext: Waiting ${delay}ms before attempt ${attempt}`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        const result = await validateSession()
        console.log(`🔍 TherapistUserContext: Attempt ${attempt} result:`, result)
        
        if (result) {
          console.log('✅ TherapistUserContext: Auth initialization successful')
          setLoading(false)
          return
        }
      }
      
      console.log('🔍 TherapistUserContext: Setting loading to false')
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const logout = () => {
    // Clear therapist user cookie
    document.cookie = 'trpi_therapist_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    // Also clear individual user cookie in case therapist was using that
    document.cookie = 'trpi_individual_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    setTherapistUser(null)
    setIsAuthenticated(false)
    router.push('/therapist/login')
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
    throw new Error('useTherapistUser must be used within a TherapistUserProvider')
  }
  return context
}
