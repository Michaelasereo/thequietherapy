"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { therapistEvents, THERAPIST_EVENTS, AvatarUpdatedData, ProfileUpdatedData } from '@/lib/events'

interface TherapistProfile {
  id: string
  email: string
  full_name: string
  user_type: 'therapist'
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  profile_image_url?: string // STANDARDIZED - only this field now
  session_token?: string
  // Therapist-specific fields
  specialization?: string
  bio?: string
  experience_years?: number
  license_number?: string
  verification_status?: 'pending' | 'approved' | 'rejected'
  // Edit tracking fields
  edited_fields?: string[]
  original_enrollment_data?: any
  profile_updated_at?: string | null
  enrollment_date?: string
}

interface TherapistUserContextType {
  therapist: TherapistProfile | null
  therapistUser: TherapistProfile | null  // Alias for backward compatibility
  loading: boolean
  isAuthenticated: boolean
  refreshTherapist: () => Promise<void>
  validateSession: () => Promise<void>  // Alias for refreshTherapist
  updateTherapist: (updates: Partial<TherapistProfile>) => void  // NEW: Direct update method
  logout: () => Promise<void>
  // Edit tracking helpers
  isFieldEdited: (fieldName: string) => boolean
  getOriginalValue: (fieldName: string) => any
  hasOriginalData: () => boolean
}

const TherapistUserContext = createContext<TherapistUserContextType | undefined>(undefined)

export function TherapistUserProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout: authLogout, refreshUser } = useAuth()
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Direct update method - updates local state and emits event
  const updateTherapist = useCallback((updates: Partial<TherapistProfile>) => {
    console.log('🔄 TherapistContext: updateTherapist called with:', updates)
    setTherapist(current => {
      if (!current) return current
      return { ...current, ...updates }
    })
    
    // Emit event for other components to listen
    therapistEvents.emit(THERAPIST_EVENTS.PROFILE_UPDATED, updates)
  }, [])

  // Listen for events from other components
  useEffect(() => {
    const handleAvatarUpdated = (data: AvatarUpdatedData) => {
      console.log('📸 TherapistContext: Avatar updated event received:', data)
      setTherapist(current => {
        if (!current) return current
        return { ...current, profile_image_url: data.profile_image_url }
      })
    }

    const handleProfileUpdated = (data: ProfileUpdatedData) => {
      console.log('✏️ TherapistContext: Profile updated event received:', data)
      setTherapist(current => {
        if (!current) return current
        return { ...current, ...data }
      })
    }

    therapistEvents.on(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdated)
    therapistEvents.on(THERAPIST_EVENTS.PROFILE_UPDATED, handleProfileUpdated)

    return () => {
      therapistEvents.off(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdated)
      therapistEvents.off(THERAPIST_EVENTS.PROFILE_UPDATED, handleProfileUpdated)
    }
  }, [])

  // Refresh therapist data
  const refreshTherapist = useCallback(async () => {
    console.log('🔍 TherapistContext: refreshTherapist called with user:', user);
    console.log('🔍 TherapistContext: user object:', JSON.stringify(user, null, 2));
    console.log('🔍 TherapistContext: user.user_type:', user?.user_type);
    
    if (!user || user.user_type !== 'therapist') {
      console.log('❌ TherapistContext: Not a therapist user, skipping fetch. User type is:', user?.user_type);
      setTherapist(null)
      setLoading(false)
      return
    }
    
    console.log('✅ TherapistContext: User is therapist, proceeding to fetch profile...');

    try {
      setLoading(true)
      
      // Fetch therapist-specific data with cache-busting timestamp
      const cacheBuster = Date.now()
      console.log('🔄 TherapistContext: Fetching profile with cache buster:', cacheBuster)
      const response = await fetch(`/api/therapist/profile?t=${cacheBuster}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 TherapistContext: API response data:', data);
        console.log('🔍 TherapistContext: Full therapist object from API:', JSON.stringify(data.therapist, null, 2));
        if (data.success && data.therapist) {
          console.log('🔍 TherapistContext: Setting therapist data:', data.therapist);
          console.log('🔍 TherapistContext: profile_image_url from API:', data.therapist.profile_image_url);
          
          // Create a new object to force re-render
          const therapistData = { ...data.therapist }
          setTherapist(therapistData)
        } else {
          // Fallback to basic user data
          console.warn('⚠️ TherapistContext: Using fallback data (API response not successful)')
          setTherapist({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: 'therapist',
            is_verified: user.is_verified,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            profile_image_url: user.avatar_url, // Map from old user field if exists
            session_token: user.session_token
          })
        }
      } else {
        // Fallback to basic user data
        console.warn('⚠️ TherapistContext: Using fallback data (API response not OK, status:', response.status, ')')
        setTherapist({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: 'therapist',
          is_verified: user.is_verified,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          profile_image_url: user.avatar_url, // Map from old user field if exists
          session_token: user.session_token
        })
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error)
      // Fallback to basic user data
      setTherapist({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: 'therapist',
        is_verified: user.is_verified,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile_image_url: user.avatar_url, // Map from old user field if exists
        session_token: user.session_token
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authLogout()
      setTherapist(null)
    } catch (error) {
      console.error('Error during therapist logout:', error)
    }
  }, [authLogout])

  // Edit tracking helper functions
  const isFieldEdited = useCallback((fieldName: string): boolean => {
    if (!therapist || !therapist.edited_fields) return false
    return therapist.edited_fields.includes(fieldName)
  }, [therapist])

  const getOriginalValue = useCallback((fieldName: string): any => {
    if (!therapist || !therapist.original_enrollment_data) return null
    return therapist.original_enrollment_data[fieldName]
  }, [therapist])

  const hasOriginalData = useCallback((): boolean => {
    return !!(therapist && therapist.original_enrollment_data)
  }, [therapist])

  // Initial load and user changes
  useEffect(() => {
    console.log('🔍 TherapistContext: useEffect triggered', { 
      authLoading, 
      hasUser: !!user, 
      userType: user?.user_type,
      userId: user?.id 
    });
    
    if (authLoading) {
      console.log('🔍 TherapistContext: Auth still loading, waiting...')
      setLoading(true)
      return
    }

    if (!user) {
      console.log('🔍 TherapistContext: No user, clearing therapist state')
      setTherapist(null)
      setLoading(false)
      return
    }

    console.log('🔍 TherapistContext: Checking user type:', user.user_type, '=== "therapist"?', user.user_type === 'therapist')
    
    if (user.user_type === 'therapist') {
      console.log('✅ TherapistContext: User is therapist, calling refreshTherapist()')
      refreshTherapist()
    } else {
      console.log('❌ TherapistContext: User is NOT therapist (type:', user.user_type, '), clearing state')
      setTherapist(null)
      setLoading(false)
    }
  }, [user, authLoading, refreshTherapist])

  // Periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!user || user.user_type !== 'therapist') return

    const interval = setInterval(() => {
      refreshTherapist()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, refreshTherapist])

  const value: TherapistUserContextType = {
    therapist,
    therapistUser: therapist,  // Alias for backward compatibility
    loading,
    isAuthenticated: !!therapist,
    refreshTherapist,
    validateSession: refreshTherapist,  // Alias for refreshTherapist
    updateTherapist,  // NEW: Direct update method
    logout,
    // Edit tracking helpers
    isFieldEdited,
    getOriginalValue,
    hasOriginalData
  }

  return (
    <TherapistUserContext.Provider value={value}>
      {children}
    </TherapistUserContext.Provider>
  )
}

export function useTherapistUser(): TherapistUserContextType {
  const context = useContext(TherapistUserContext)
  if (context === undefined) {
    console.error('❌ useTherapistUser called outside TherapistUserProvider')
    throw new Error('useTherapistUser must be used within a TherapistUserProvider')
  }
  return context
}
