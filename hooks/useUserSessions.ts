"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Session {
  id: string
  user_id: string
  therapist_id: string
  session_date: string
  duration: number
  status: string
  notes: string
  created_at: string
}

export function useUserSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user sessions
  const getSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setSessions(data || [])
      }
    } catch (err) {
      setError('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }

  // Get upcoming sessions
  const getUpcomingSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', today)
        .order('session_date', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        return data || []
      }
    } catch (err) {
      setError('Failed to fetch upcoming sessions')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Get past sessions
  const getPastSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .lt('session_date', today)
        .order('session_date', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        return data || []
      }
    } catch (err) {
      setError('Failed to fetch past sessions')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Book a new session
  const bookSession = async (sessionData: {
    therapist_id: string
    session_date: string
    duration: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          therapist_id: sessionData.therapist_id,
          session_date: sessionData.session_date,
          duration: sessionData.duration,
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else {
        // Refresh sessions list
        await getSessions()
        return data
      }
    } catch (err) {
      setError('Failed to book session')
    } finally {
      setLoading(false)
    }
  }

  // Cancel a session
  const cancelSession = async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session_id, sessionId)
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
      } else {
        // Refresh sessions list
        await getSessions()
      }
    } catch (err) {
      setError('Failed to cancel session')
    } finally {
      setLoading(false)
    }
  }

  // Load sessions on mount
  useEffect(() => {
    getSessions()
  }, [])

  return {
    sessions,
    loading,
    error,
    getSessions,
    getUpcomingSessions,
    getPastSessions,
    bookSession,
    cancelSession
  }
}
