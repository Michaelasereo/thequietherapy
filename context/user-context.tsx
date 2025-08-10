"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie" // Still needed for client-side logout and initial read

type User = {
  name: string
  email: string
  id: string
  // Add other user properties as needed
}

type UserContextType = {
  user: User | null
  // login: (userData: User) => void // Removed: Login handled by server action
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Read user from cookie on client-side load
    const storedUser = Cookies.get("trpi_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    } else {
      // Temporarily set a default user for demonstration if no cookie is found
      setUser({ id: "temp-user-123", name: "Michael", email: "temp@example.com" })
      setIsAuthenticated(true)
    }
  }, []) // Empty dependency array means this runs once on mount

  const logout = () => {
    Cookies.remove("trpi_user") // Remove cookie client-side
    setUser(null)
    setIsAuthenticated(false)
    router.push("/login")
  }

  return <UserContext.Provider value={{ user, logout, isAuthenticated }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
