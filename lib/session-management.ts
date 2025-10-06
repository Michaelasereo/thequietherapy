// Note: This file now uses secure API endpoints instead of direct database queries

// Types
export interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  status: string
  duration: number
  
  // Primary fields (what frontend prefers)
  start_time?: string    // Combined datetime or time
  end_time?: string
  
  // Fallback fields (what database actually has)
  scheduled_date?: string // Database field
  scheduled_time?: string // Database field
  duration_minutes?: number
  
  // Session details
  session_type?: 'video' | 'audio' | 'chat' | 'in_person'
  title?: string
  description?: string
  notes?: string
  session_url?: string
  room_name?: string
  // Recording removed for HIPAA compliance
  price?: number
  currency?: string
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed'
  cancellation_reason?: string
  cancelled_by?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
  
  // Alternative field names for compatibility
  client_id?: string
  
  // Joined data
  therapist?: {
    id: string
    full_name: string
    email: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
  
  // Session notes data
  session_notes?: {
    id: string
    notes?: string
    soap_notes?: string
    ai_notes_generated?: boolean
    ai_notes_generated_at?: string
    created_at: string
    updated_at: string
  }
  
  // Flattened fields for easier access
  therapist_name?: string
  therapist_email?: string
  user_name?: string
  user_email?: string
}

export interface DashboardSessions {
  upcoming: SessionData[]
  today: SessionData[]
  thisWeek: SessionData[]
  past: SessionData[]
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const response = await fetch(`/api/sessions?user_id=${userId}&order=scheduled_date.desc`, {
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      console.warn('Sessions API returned non-OK status:', response.status)
      // Return empty array instead of throwing - graceful degradation
      return []
    }

    const data = await response.json()
    
    // Handle both success and error responses gracefully
    if (data.success === false) {
      console.warn('Sessions API returned error:', data.error)
      return []
    }
    
    return data.sessions || []
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    // Return empty array instead of throwing - prevents UI crashes
    return []
  }
}

/**
 * Get all sessions for a therapist
 */
export async function getTherapistSessions(therapistId: string): Promise<SessionData[]> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const response = await fetch(`/api/sessions?therapist_id=${therapistId}&order=scheduled_date.desc`, {
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      throw new Error('Failed to fetch therapist sessions')
    }

    const { sessions } = await response.json()
    return sessions || []
  } catch (error) {
    console.error('Error fetching therapist sessions:', error)
    throw new Error('Failed to fetch therapist sessions')
  }
}

/**
 * Get upcoming sessions for a user
 */
export async function getUpcomingSessions(userId: string): Promise<SessionData[]> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const response = await fetch(`/api/sessions?user_id=${userId}&upcoming=true&order=scheduled_date.asc&limit=10`, {
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming sessions')
    }

    const { sessions } = await response.json()
    return sessions || []
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    throw new Error('Failed to fetch upcoming sessions')
  }
}

/**
 * Get today's sessions for a user or therapist
 */
export async function getTodaySessions(userId: string, isTherapist = false): Promise<SessionData[]> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const params = new URLSearchParams({
      [isTherapist ? 'therapist_id' : 'user_id']: userId,
      status: 'scheduled,in_progress',
      order: 'start_time.asc'
    })

    const response = await fetch(`/api/sessions?${params}`, {
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      throw new Error('Failed to fetch today sessions')
    }

    const { sessions } = await response.json()
    return sessions || []
  } catch (error) {
    console.error('Error fetching today sessions:', error)
    throw new Error('Failed to fetch today sessions')
  }
}

/**
 * Get organized dashboard sessions
 */
export async function getDashboardSessions(userId: string, isTherapist = false): Promise<DashboardSessions> {
  try {
    // ✅ SECURE: Call your own API endpoints for different session types
    const [upcoming, today, thisWeek, past] = await Promise.all([
      // Upcoming sessions
      fetch(`/api/sessions?${isTherapist ? 'therapist_id' : 'user_id'}=${userId}&status=scheduled&upcoming=true&order=start_time.asc&limit=5`, {
        credentials: 'include'
      }),
      
      // Today's sessions
      fetch(`/api/sessions?${isTherapist ? 'therapist_id' : 'user_id'}=${userId}&status=scheduled,in_progress&order=start_time.asc`, {
        credentials: 'include'
      }),
      
      // This week's sessions
      fetch(`/api/sessions?${isTherapist ? 'therapist_id' : 'user_id'}=${userId}&status=scheduled,in_progress,completed&order=start_time.asc`, {
        credentials: 'include'
      }),
      
      // Past sessions
      fetch(`/api/sessions?${isTherapist ? 'therapist_id' : 'user_id'}=${userId}&status=completed,cancelled,no_show&order=start_time.desc&limit=10`, {
        credentials: 'include'
      })
    ])

    const [upcomingData, todayData, thisWeekData, pastData] = await Promise.all([
      upcoming.ok ? upcoming.json() : { sessions: [] },
      today.ok ? today.json() : { sessions: [] },
      thisWeek.ok ? thisWeek.json() : { sessions: [] },
      past.ok ? past.json() : { sessions: [] }
    ])

    return {
      upcoming: upcomingData.sessions || [],
      today: todayData.sessions || [],
      thisWeek: thisWeekData.sessions || [],
      past: pastData.sessions || []
    }
  } catch (error) {
    console.error('Error in getDashboardSessions:', error)
    throw error
  }
}

/**
 * Join a video session
 */
export async function joinSession(sessionId: string, userId: string): Promise<{ success: boolean; session_url?: string; room_name?: string; error?: string }> {
  try {
    // ✅ SECURE: Call the correct API endpoint
    const response = await fetch('/api/sessions/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        sessionId: sessionId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to join session' }
    }

    const result = await response.json()
    return { 
      success: true, 
      session_url: result.data?.room_url, 
      room_name: result.data?.room_name 
    }
  } catch (error) {
    console.error('Error joining session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Complete a session
 */
export async function completeSession(sessionId: string, notes?: string, recordingUrl?: string): Promise<{ success: boolean; error?: string; soapNotes?: string }> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        action: 'complete',
        sessionId: sessionId,
        notes: notes,
        recordingUrl: recordingUrl
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to complete session' }
    }

    const result = await response.json()
    return { success: true, soapNotes: result.soapNotes }
  } catch (error) {
    console.error('Error completing session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Cancel a session
 */
export async function cancelSession(sessionId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // ✅ SECURE: Call your own API endpoint
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        action: 'cancel',
        sessionId: sessionId,
        reason: reason
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to cancel session' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelling session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Note: Daily.co room creation is now handled server-side in the API endpoints