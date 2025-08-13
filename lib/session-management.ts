import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  session_type: string
  notes?: string
  room_url?: string
  created_at: string
  updated_at: string
}

export interface SessionNote {
  id: string
  session_id: string
  therapist_id: string
  content: string
  created_at: string
}

// Book a session
export async function bookSession(
  userId: string,
  therapistId: string,
  startTime: string,
  endTime: string,
  sessionType: string = 'therapy'
): Promise<SessionData | null> {
  try {
    // First, check if user has enough credits
    const { data: userData, error: userError } = await supabase
      .from('global_users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Failed to fetch user credits')
    }

    if (userData.credits < 1) {
      throw new Error('Insufficient credits. You need at least 1 credit to book a session.')
    }

    // Check if the time slot is available
    const { data: availabilityData, error: availabilityError } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('start_time', startTime)
      .eq('is_available', true)
      .single()

    if (availabilityError || !availabilityData) {
      throw new Error('Selected time slot is not available')
    }

    // Create the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('global_sessions')
      .insert({
        user_id: userId,
        therapist_id: therapistId,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
        session_type: sessionType,
        room_url: `https://meet.daily.co/${Date.now()}-${userId}-${therapistId}`
      })
      .select()
      .single()

    if (sessionError) {
      throw new Error('Failed to create session')
    }

    // Deduct 1 credit from user
    const { error: creditError } = await supabase
      .from('global_users')
      .update({ credits: userData.credits - 1 })
      .eq('id', userId)

    if (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Note: In production, you might want to rollback the session creation
    }

    // Mark the availability slot as booked
    await supabase
      .from('therapist_availability')
      .update({ is_available: false })
      .eq('id', availabilityData.id)

    return sessionData
  } catch (error) {
    console.error('Error booking session:', error)
    throw error
  }
}

// Get user's sessions
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    return []
  }
}

// Get upcoming sessions
export async function getUpcomingSessions(userId: string): Promise<SessionData[]> {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', now)
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    return []
  }
}

// Join a session (update status to in_progress)
export async function joinSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('global_sessions')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error joining session:', error)
    return false
  }
}

// Complete a session
export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('global_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error completing session:', error)
    return false
  }
}

// Add session note (for therapist)
export async function addSessionNote(
  sessionId: string,
  therapistId: string,
  content: string
): Promise<SessionNote | null> {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        session_id: sessionId,
        therapist_id: therapistId,
        content: content
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error adding session note:', error)
    return null
  }
}

// Get session notes
export async function getSessionNotes(sessionId: string): Promise<SessionNote[]> {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching session notes:', error)
    return []
  }
}

// Get session by ID
export async function getSessionById(sessionId: string): Promise<SessionData | null> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          avatar_url
        ),
        user:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
}
