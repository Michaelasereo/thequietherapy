"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface TestUser {
  id: string
  email: string
  name: string
  type: string
  isTestUser: boolean
}

interface TestUserContextType {
  testUser: TestUser | null
  setTestUser: (user: TestUser | null) => void
  isTestMode: boolean
}

const TestUserContext = createContext<TestUserContextType | undefined>(undefined)

export function TestUserProvider({ children }: { children: React.ReactNode }) {
  const [testUser, setTestUser] = useState<TestUser | null>(null)

  useEffect(() => {
    // Check for test user in localStorage on mount
    const storedTestUser = localStorage.getItem('trpi_test_user')
    if (storedTestUser) {
      try {
        const user = JSON.parse(storedTestUser)
        setTestUser(user)
      } catch (error) {
        console.error('Error parsing test user:', error)
      }
    }
  }, [])

  const isTestMode = !!testUser

  return (
    <TestUserContext.Provider value={{ testUser, setTestUser, isTestMode }}>
      {children}
    </TestUserContext.Provider>
  )
}

export function useTestUser() {
  const context = useContext(TestUserContext)
  if (context === undefined) {
    throw new Error('useTestUser must be used within a TestUserProvider')
  }
  return context
}
