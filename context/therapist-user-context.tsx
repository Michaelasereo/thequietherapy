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
  logout: () => void
  isAuthenticated: boolean
}

const TherapistUserContext = createContext<TherapistUserContextType | undefined>(undefined)

export function TherapistUserProvider({ children }: { children: ReactNode }) {
  const [therapistUser, setTherapistUser] = useState<TherapistUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedUser = Cookies.get("trpi_therapist_user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setTherapistUser(userData)
      setIsAuthenticated(true)
      
      // Fetch additional therapist data from API
      fetch('/api/therapist/profile')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.therapist) {
            setTherapistUser({
              ...userData,
              name: data.therapist.full_name,
              email: data.therapist.email,
              specialization: data.therapist.specialization,
              licenseNumber: data.therapist.license_number,
              phone: data.therapist.phone,
              languages: data.therapist.languages,
              bio: data.therapist.bio,
              hourlyRate: data.therapist.hourly_rate,
              status: data.therapist.status
            })
          }
        })
        .catch(error => {
          console.error('Error fetching therapist profile:', error)
        })
    } else {
      setTherapistUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const logout = () => {
    Cookies.remove("trpi_therapist_user")
    setTherapistUser(null)
    setIsAuthenticated(false)
    router.push("/therapist/login")
  }

  return (
    <TherapistUserContext.Provider value={{ therapistUser, logout, isAuthenticated }}>
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
