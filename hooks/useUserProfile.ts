"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: string
  credits: number
  package_type: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔍 Starting to load user profile...')
        
        // First try to get the current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Supabase session:', session?.user?.email)
        
        if (session?.user) {
          // User is authenticated via Supabase auth
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (data) {
            console.log('✅ Loaded profile from Supabase auth:', data)
            setProfile(data)
            setLoading(false)
            return
          }
        }

        // Check for active sessions in user_sessions table
        console.log('🔍 Checking user_sessions table for active sessions...')
        
        // Get current time in ISO format
        const now = new Date().toISOString()
        console.log('Current time:', now)
        
        // First, let's see all sessions to debug
        const { data: allSessions, error: allSessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('All sessions:', allSessions)
        
        if (allSessionsError) {
          console.error('❌ Error fetching all sessions:', allSessionsError)
        }

        // Filter active sessions manually to avoid timezone issues
        const activeSessions = allSessions?.filter(session => {
          const expiresAt = new Date(session.expires_at)
          const currentTime = new Date()
          const isActive = expiresAt > currentTime
          console.log(`Session ${session.id}: expires_at=${session.expires_at}, isActive=${isActive}`)
          return isActive
        }) || []

        console.log('Active sessions (filtered):', activeSessions)
        
        if (activeSessions.length > 0) {
          const latestSession = activeSessions[0]
          console.log('Using latest active session:', latestSession)
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', latestSession.user_id)
            .single()

          if (userError) {
            console.error('❌ Error loading user data:', userError)
          }

          if (userData) {
            console.log('✅ Loaded profile from session:', userData)
            setProfile(userData)
          } else {
            console.log('❌ No user data found for session')
          }
        } else {
          console.log('❌ No active sessions found')
        }

      } catch (error) {
        console.error('❌ Error loading user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return { profile, loading }
}
