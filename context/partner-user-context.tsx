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
  isAuthenticated: boolean
  logout: () => void
}

const PartnerUserContext = createContext<PartnerUserContextType | undefined>(undefined)

export function PartnerUserProvider({ children }: { children: ReactNode }) {
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedUser = Cookies.get("trpi_partner_user")
    if (storedUser) {
      setPartnerUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    } else {
      setPartnerUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const logout = () => {
    Cookies.remove("trpi_partner_user")
    setPartnerUser(null)
    setIsAuthenticated(false)
    router.push("/partner/auth")
  }

  return (
    <PartnerUserContext.Provider value={{ partnerUser, logout, isAuthenticated }}>
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
