"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type TherapistUser = {
  id: string
  name: string
  email: string
  role: "therapist"
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
      setTherapistUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
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
