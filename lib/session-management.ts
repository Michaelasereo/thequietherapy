import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simplified session management functions
export interface SessionData {
  id?: string
  user_id: string
  therapist_id: string
  start_time: string
  end_time: string
  duration?: number
  session_type?: string
  status?: string
  notes?: string
  session_url?: string
  recording_url?: string
}

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

// Check if therapist is available for a specific time slot
export async function checkTherapistAvailability(
  therapistId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const dayOfWeek = startTime.getDay() // 0 = Sunday, 6 = Saturday
    const startTimeStr = startTime.toTimeString().split(' ')[0]
    const endTimeStr = endTime.toTimeString().split(' ')[0]

    // Check if therapist has availability for this day and time
    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .gte('start_time', startTimeStr)
      .lte('end_time', endTimeStr)
      .single()

    if (error || !availability) {
      return false
    }

    // Check for conflicting sessions
    const { data: conflicts, error: conflictError } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .in('status', ['scheduled', 'in_progress'])
      .or(`start_time.lte.${startTime.toISOString()},end_time.gte.${endTime.toISOString()}`)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return false
    }

    return conflicts.length === 0
  } catch (error) {
    console.error('Error checking therapist availability:', error)
    return false
  }
}

// Get available time slots for a therapist on a specific date
export async function getAvailableSlots(
  therapistId: string,
  date: Date,
  duration: number = 60
): Promise<Array<{ start_time: string; end_time: string }>> {
  try {
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    // Get therapist availability for this day
    const { data: availability, error } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .order('start_time')

    if (error || !availability || availability.length === 0) {
      return []
    }

    const availableSlots: Array<{ start_time: string; end_time: string }> = []

    for (const slot of availability) {
      const slotStart = new Date(`${dateStr}T${slot.start_time}`)
      const slotEnd = new Date(`${dateStr}T${slot.end_time}`)

      // Generate time slots within the availability window
      let currentStart = slotStart
      while (currentStart.getTime() + duration * 60000 <= slotEnd.getTime()) {
        const currentEnd = new Date(currentStart.getTime() + duration * 60000)

        // Check if this slot conflicts with existing sessions
        const { data: conflicts, error: conflictError } = await supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', therapistId)
          .in('status', ['scheduled', 'in_progress'])
          .or(`start_time.lte.${currentStart.toISOString()},end_time.gte.${currentEnd.toISOString()}`)

        if (!conflictError && conflicts.length === 0) {
          availableSlots.push({
            start_time: currentStart.toISOString(),
            end_time: currentEnd.toISOString()
          })
        }

        currentStart = new Date(currentStart.getTime() + duration * 60000)
      }
    }

    return availableSlots
  } catch (error) {
    console.error('Error getting available slots:', error)
    return []
  }
}

// Book a session
export async function bookSession(sessionData: SessionData): Promise<{ success: boolean; session?: any; error?: string }> {
  try {
    // Check if therapist is available
    const isAvailable = await checkTherapistAvailability(
      sessionData.therapist_id,
      new Date(sessionData.start_time),
      new Date(sessionData.end_time)
    )

    if (!isAvailable) {
      return { success: false, error: 'Therapist is not available for this time slot' }
    }

    // Check if user has enough credits (simplified check)
    const { data: user, error: userError } = await supabase
      .from('individual_auth')
      .select('credits')
      .eq('user_id', sessionData.user_id)
      .single()

    if (userError || !user || user.credits < 1) {
      return { success: false, error: 'Insufficient credits' }
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        ...sessionData,
        status: sessionData.status || 'scheduled',
        duration: sessionData.duration || 60,
        session_type: sessionData.session_type || 'video'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Failed to book session' }
    }

    // Deduct credits from user
    await supabase
      .from('individual_auth')
      .update({ credits: user.credits - 1 })
      .eq('user_id', sessionData.user_id)

    return { success: true, session }
  } catch (error) {
    console.error('Error booking session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get sessions for a user or therapist
export async function getSessions(
  userId?: string,
  therapistId?: string,
  status?: string
): Promise<Array<any>> {
  try {
    let query = supabase
      .from('sessions')
      .select('*')
      .order('start_time', { ascending: true })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return []
    }

    return sessions || []
  } catch (error) {
    console.error('Error getting sessions:', error)
    return []
  }
}

// Update session status
export async function updateSessionStatus(
  sessionId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating session status:', error)
      return { success: false, error: 'Failed to update session status' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating session status:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get sessions for a specific user
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }

    return sessions || []
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return []
  }
}

// Get upcoming sessions for a user
export async function getUpcomingSessions(userId: string): Promise<SessionData[]> {
  try {
    const now = new Date().toISOString()
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming sessions:', error)
      return []
    }

    return sessions || []
  } catch (error) {
    console.error('Error getting upcoming sessions:', error)
    return []
  }
}

// Get a specific session by ID
export async function getSessionById(sessionId: string): Promise<SessionData | null> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session by ID:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting session by ID:', error)
    return null
  }
}

// Join a session (update status to in_progress)
export async function joinSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error joining session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error joining session:', error)
    return false
  }
}

// Complete a session (update status to completed)
export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error completing session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error completing session:', error)
    return false
  }
}
