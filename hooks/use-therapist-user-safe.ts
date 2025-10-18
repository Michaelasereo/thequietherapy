'use client'

import { useTherapistUser } from '@/context/therapist-user-context'
import { useEffect, useState } from 'react'

/**
 * Safe wrapper for useTherapistUser that handles initialization timing
 */
export function useTherapistUserSafe() {
  const [isReady, setIsReady] = useState(false)
  const [contextData, setContextData] = useState<any>(null)

  useEffect(() => {
    try {
      // Try to get context - might throw if not ready
      const data = useTherapistUser()
      if (data && !isReady) {
        setContextData(data)
        setIsReady(true)
      }
    } catch (error) {
      console.warn('Context not ready yet:', error)
    }
  }, [isReady])

  if (!isReady || !contextData) {
    return {
      therapistUser: null,
      therapist: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,
      refreshTherapist: async () => {},
      validateSession: async () => {},
      logout: async () => {},
      isFieldEdited: () => false,
      getOriginalValue: () => null,
      hasOriginalData: () => false
    }
  }

  return {
    ...contextData,
    isInitialized: true
  }
}

