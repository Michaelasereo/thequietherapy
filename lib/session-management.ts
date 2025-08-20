import { supabase } from '@/lib/supabase'

export interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  scheduled_date: string
  scheduled_time: string
  session_type: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  session_link?: string
  session_summary?: string
  amount_paid: number
  duration_minutes?: number
  created_at: string
  updated_at: string
  client_name?: string
  therapist_name?: string
  reschedule_reason?: string
  cancellation_reason?: string
  notes?: string
}

export interface SessionDetails extends SessionData {
  client: {
    id: string
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
  }
  therapist: {
    id: string
    full_name: string
    email: string
    specialization?: string
    avatar_url?: string
  }
  session_notes?: Array<{
    id: string
    note: string
    created_at: string
    created_by: string
  }>
  reschedule_history?: Array<{
    id: string
    old_date: string
    new_date: string
    reason: string
    requested_by: string
    created_at: string
  }>
}

// Book a session
export async function bookSession(sessionData: any): Promise<{ success: boolean; session?: any; error?: string }> {
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

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('global_sessions')
      .insert({
        user_id: sessionData.user_id,
        therapist_id: sessionData.therapist_id,
        scheduled_date: sessionData.scheduled_date,
        scheduled_time: sessionData.scheduled_time,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        session_type: sessionData.session_type || 'Therapy Session',
        status: 'scheduled',
        amount_paid: 5000, // Default amount
        notes: sessionData.notes
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Failed to book session' }
    }

    return { success: true, session }
  } catch (error) {
    console.error('Error booking session:', error)
    return { success: false, error: 'Internal server error' }
  }
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
      .from('global_sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .in('status', ['scheduled', 'in_progress'])
      .or(`scheduled_date.eq.${startTime.toISOString().split('T')[0]}`)

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
          .from('global_sessions')
          .select('*')
          .eq('therapist_id', therapistId)
          .in('status', ['scheduled', 'in_progress'])
          .or(`scheduled_time.eq.${slot.start_time}`)

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

// Get sessions for a user or therapist
export async function getSessions(
  userId?: string,
  therapistId?: string,
  status?: string
): Promise<Array<any>> {
  try {
    let query = supabase
      .from('global_sessions')
      .select('*')
      .order('scheduled_date', { ascending: true })

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

// Get user sessions
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        ),
        therapists:therapist_id (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }

    return data?.map(session => ({
      ...session,
      client_name: session.users?.full_name,
      therapist_name: session.therapists?.full_name
    })) || []
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
        users:user_id (
          full_name,
          email
        ),
        therapists:therapist_id (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .gte('scheduled_date', now.split('T')[0])
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming sessions:', error)
      return []
    }

    return data?.map(session => ({
      ...session,
      client_name: session.users?.full_name,
      therapist_name: session.therapists?.full_name
    })) || []
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    return []
  }
}

// Get session by ID (legacy function for compatibility)
export async function getSessionById(sessionId: string): Promise<SessionData | null> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        ),
        therapists:therapist_id (
          full_name,
          email
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session by ID:', error)
      return null
    }

    return {
      ...data,
      client_name: data.users?.full_name,
      therapist_name: data.therapists?.full_name
    }
  } catch (error) {
    console.error('Error getting session by ID:', error)
    return null
  }
}

// Get session details
export async function getSessionDetails(sessionId: string): Promise<SessionDetails | null> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          phone,
          avatar_url
        ),
        therapists:therapist_id (
          id,
          full_name,
          email,
          specialization,
          avatar_url
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session details:', error)
      return null
    }

    // Get session notes
    const { data: notesData } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    // Get reschedule history
    const { data: rescheduleData } = await supabase
      .from('session_reschedules')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    return {
      ...data,
      client: data.users,
      therapist: data.therapists,
      session_notes: notesData || [],
      reschedule_history: rescheduleData || []
    }
  } catch (error) {
    console.error('Error fetching session details:', error)
    return null
  }
}

// Join session (for video call)
export async function joinSession(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user has permission to join this session
    const { data: session, error: sessionError } = await supabase
      .from('global_sessions')
      .select('user_id, therapist_id, status, scheduled_date, scheduled_time')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Check if user is authorized (client or therapist)
    if (session.user_id !== userId && session.therapist_id !== userId) {
      return { success: false, error: 'Unauthorized access' }
    }

    // Check if session is scheduled and within time window
    const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    const now = new Date()
    const timeDiff = sessionDateTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    if (session.status !== 'scheduled') {
      return { success: false, error: 'Session is not available for joining' }
    }

    if (minutesDiff < -30) {
      return { success: false, error: 'Session has ended' }
    }

    if (minutesDiff > 15) {
      return { success: false, error: 'Session has not started yet' }
    }

    // Update session status to in_progress
    const { error: updateError } = await supabase
      .from('global_sessions')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session status:', updateError)
      return { success: false, error: 'Failed to start session' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error joining session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Complete session
export async function completeSession(sessionId: string, summary?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('global_sessions')
      .update({ 
        status: 'completed',
        session_summary: summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error completing session:', error)
      return { success: false, error: 'Failed to complete session' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error completing session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Reschedule session
export async function rescheduleSession(
  sessionId: string, 
  newDate: string, 
  newTime: string, 
  reason: string, 
  requestedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session details
    const { data: session, error: sessionError } = await supabase
      .from('global_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Check if session can be rescheduled
    if (session.status !== 'scheduled') {
      return { success: false, error: 'Session cannot be rescheduled' }
    }

    // Check if new date/time is in the future
    const newDateTime = new Date(`${newDate}T${newTime}`)
    const now = new Date()
    if (newDateTime <= now) {
      return { success: false, error: 'New session time must be in the future' }
    }

    // Start transaction
    const { error: updateError } = await supabase
      .from('global_sessions')
      .update({ 
        scheduled_date: newDate,
        scheduled_time: newTime,
        status: 'rescheduled',
        reschedule_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error rescheduling session:', updateError)
      return { success: false, error: 'Failed to reschedule session' }
    }

    // Log reschedule history
    const { error: historyError } = await supabase
      .from('session_reschedules')
      .insert({
        session_id: sessionId,
        old_date: session.scheduled_date,
        old_time: session.scheduled_time,
        new_date: newDate,
        new_time: newTime,
        reason: reason,
        requested_by: requestedBy
      })

    if (historyError) {
      console.error('Error logging reschedule history:', historyError)
      // Don't fail the operation, just log the error
    }

    return { success: true }
  } catch (error) {
    console.error('Error rescheduling session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Cancel session
export async function cancelSession(
  sessionId: string, 
  reason: string, 
  cancelledBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session details
    const { data: session, error: sessionError } = await supabase
      .from('global_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Check if session can be cancelled
    if (session.status !== 'scheduled') {
      return { success: false, error: 'Session cannot be cancelled' }
    }

    // Check if session is within cancellation window (24 hours)
    const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    const now = new Date()
    const timeDiff = sessionDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)

    if (hoursDiff < 24) {
      return { success: false, error: 'Session cannot be cancelled within 24 hours' }
    }

    // Update session status
    const { error: updateError } = await supabase
      .from('global_sessions')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error cancelling session:', updateError)
      return { success: false, error: 'Failed to cancel session' }
    }

    // Log cancellation
    const { error: logError } = await supabase
      .from('session_cancellations')
      .insert({
        session_id: sessionId,
        reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging cancellation:', logError)
      // Don't fail the operation, just log the error
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelling session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Add session note
export async function addSessionNote(
  sessionId: string, 
  note: string, 
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('session_notes')
      .insert({
        session_id: sessionId,
        note: note,
        created_by: createdBy
      })

    if (error) {
      console.error('Error adding session note:', error)
      return { success: false, error: 'Failed to add note' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding session note:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get session notes
export async function getSessionNotes(sessionId: string): Promise<Array<{
  id: string
  note: string
  created_at: string
  created_by: string
}>> {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching session notes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching session notes:', error)
    return []
  }
}
