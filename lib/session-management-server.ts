import { createServerClient } from './supabase'

const supabase = createServerClient()

// Helper function to get user from session token
async function getUserFromSessionToken(sessionToken: string) {
  const { data, error } = await supabase
    .rpc('validate_session', { p_session_token: sessionToken })
  
  if (error || !data || data.length === 0) {
    return null
  }
  
  return data[0]
}

// Types
export interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  start_time: string
  end_time: string
  duration: number
  session_type: 'video' | 'audio' | 'chat' | 'in_person'
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  session_url?: string
  room_name?: string
  recording_url?: string
  price?: number
  currency?: string
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed'
  cancellation_reason?: string
  cancelled_by?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
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
}

/**
 * Get all sessions for a user (server-side)
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching user sessions:', error)
      throw new Error('Failed to fetch sessions')
    }

    return sessions || []
  } catch (error) {
    console.error('Error in getUserSessions:', error)
    throw error
  }
}

/**
 * Get all sessions for a therapist (server-side)
 */
export async function getTherapistSessions(therapistId: string): Promise<SessionData[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('therapist_id', therapistId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching therapist sessions:', error)
      throw new Error('Failed to fetch sessions')
    }

    return sessions || []
  } catch (error) {
    console.error('Error in getTherapistSessions:', error)
    throw error
  }
}

/**
 * Get upcoming sessions for a user (server-side)
 */
export async function getUpcomingSessions(userId: string): Promise<SessionData[]> {
  try {
    const now = new Date().toISOString()
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching upcoming sessions:', error)
      throw new Error('Failed to fetch upcoming sessions')
    }

    return sessions || []
  } catch (error) {
    console.error('Error in getUpcomingSessions:', error)
    throw error
  }
}

/**
 * Join a video session (server-side)
 */
export async function joinSession(sessionId: string, userId: string): Promise<{ success: boolean; session_url?: string; room_name?: string; meeting_token?: string; error?: string }> {
  try {
    console.log('🔍 joinSession: Looking for session:', sessionId, 'for user:', userId)
    
    // First, get the session without the user restriction to see what's in it
    const { data: sessionData, error: sessionDataError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    console.log('🔍 joinSession: Raw session data:', sessionData)
    console.log('🔍 joinSession: Session data error:', sessionDataError)

    if (sessionDataError || !sessionData) {
      return { success: false, error: 'Session not found' }
    }

    // Check if user has access to this session
    const hasAccess = sessionData.user_id === userId || sessionData.therapist_id === userId
    console.log('🔍 joinSession: Access check:', {
      user_id: sessionData.user_id,
      therapist_id: sessionData.therapist_id,
      requesting_user: userId,
      hasAccess
    })

    if (!hasAccess) {
      return { success: false, error: 'Access denied to this session' }
    }

    const session = sessionData

    // Check if session is ready to join (within 1 hour of start time)
    const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    const now = new Date()
    const timeDiff = sessionDateTime.getTime() - now.getTime()
    const thirtyMinutes = 30 * 60 * 1000 // 30 minutes for therapy session

    if (timeDiff > thirtyMinutes) {
      return { success: false, error: 'Session not ready yet. You can join 30 minutes before the start time.' }
    }

    // Check if user has credits (for patients joining therapist-scheduled sessions)
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    // For patients: Check and deduct credits if this is a therapist-scheduled session
    if (user?.user_type === 'individual' && session.status === 'scheduled' && !session.credit_used_id) {
      console.log('💳 Therapist-scheduled session detected - checking patient credits')
      
      // Check available credits
      const { data: availableCredits, error: creditsError } = await supabase
        .rpc('get_available_credits', { p_user_id: userId })

      if (creditsError || !availableCredits || availableCredits.length === 0) {
        console.error('❌ No credits available for patient')
        return { 
          success: false, 
          error: 'You need to purchase credits to join this session. Please visit your dashboard to buy session credits.' 
        }
      }

      // Use the first available credit
      const creditToUse = availableCredits[0]
      console.log('✅ Using credit:', creditToUse.credit_id, 'for session')

      // Mark the credit as used
      const { error: useCreditError } = await supabase
        .from('user_credits')
        .update({ 
          used: true,
          used_at: new Date().toISOString(),
          session_id: sessionId
        })
        .eq('id', creditToUse.credit_id)

      if (useCreditError) {
        console.error('❌ Error marking credit as used:', useCreditError)
        return { success: false, error: 'Failed to process session credit' }
      }

      // Update session with credit info
      await supabase
        .from('sessions')
        .update({ credit_used_id: creditToUse.credit_id })
        .eq('id', sessionId)

      console.log('✅ Credit deducted successfully for therapist-scheduled session')
    } else if (session.credit_used_id) {
      console.log('✅ Credit already used for this session - allowing join')
    } else {
      console.log('✅ User is therapist or session already processed - allowing join')
    }

    // Create Daily.co room if it doesn't exist
    if (!session.daily_room_url) {
      try {
        const { createTherapySessionRoom } = await import('@/lib/daily')
        const room = await createTherapySessionRoom({
          sessionId: sessionId,
          therapistName: 'Therapist', // Will be updated with actual name
          patientName: 'Patient', // Will be updated with actual name
          duration: session.duration_minutes || session.planned_duration_minutes || 30,
          scheduledTime: sessionDateTime
        })

        await supabase
          .from('sessions')
          .update({ 
            daily_room_url: room.url,
            daily_room_name: room.name,
            status: 'in_progress'
          })
          .eq('id', sessionId)
        
        // Generate meeting token for authentication
        const { createMeetingToken } = await import('@/lib/daily')
        console.log('🔍 Generating meeting token for room:', room.name)
        const meetingToken = await createMeetingToken(room.name, 'User', true)
        console.log('✅ Meeting token generated:', meetingToken ? 'Success' : 'Failed')
        
        return { 
          success: true, 
          session_url: room.url, 
          room_name: room.name,
          meeting_token: meetingToken
        }
      } catch (roomError) {
        console.error('❌ Failed to create Daily.co room:', roomError)
        return { success: false, error: 'Failed to create video room' }
      }
    }

    // Update session status if not already in progress
    if (session.status === 'scheduled') {
      await supabase
        .from('sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId)
    }

    // Generate meeting token for existing room
    const { createMeetingToken } = await import('@/lib/daily')
    console.log('🔍 Generating meeting token for existing room:', session.daily_room_name)
    const meetingToken = await createMeetingToken(session.daily_room_name, 'User', true)
    console.log('✅ Meeting token generated for existing room:', meetingToken ? 'Success' : 'Failed')

    return { 
      success: true, 
      session_url: session.daily_room_url, 
      room_name: session.daily_room_name,
      meeting_token: meetingToken
    }
  } catch (error) {
    console.error('Error joining session:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Complete a session (server-side)
 */
export async function completeSession(sessionId: string, notes?: string, recordingUrl?: string): Promise<{ success: boolean; error?: string; soapNotes?: string }> {
  try {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email,
          user_type
        ),
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Session not found' }
    }

    // Deduct credit for individual users
    if (session.user.user_type === 'individual') {
      try {
        const response = await fetch('/api/credits/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'use_credit',
            session_id: sessionId
          })
        })

        if (!response.ok) {
          console.warn('Failed to deduct credit, but continuing with session completion')
        }
      } catch (creditError) {
        console.warn('Credit deduction failed:', creditError)
      }
    }

    // Generate AI SOAP notes if recording is available
    let soapNotes = ''
    if (recordingUrl) {
      try {
        const aiResponse = await fetch('/api/ai/process-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            recordingUrl: recordingUrl,
            therapistName: session.therapist.full_name,
            patientName: session.user.full_name,
            sessionDuration: session.duration,
            manualNotes: notes
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          soapNotes = aiData.soapNotes || ''
        }
      } catch (aiError) {
        console.warn('AI note generation failed:', aiError)
      }
    }

    // Update session with completion data
    const updateData: any = {
      status: 'completed',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl
    }

    if (soapNotes) {
      updateData.soap_notes = soapNotes
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Error completing session:', error)
      return { success: false, error: 'Failed to complete session' }
    }

    console.log('✅ Session completed successfully:', sessionId)

    return { success: true, soapNotes }
  } catch (error) {
    console.error('Error in completeSession:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Cancel a session (server-side)
 */
export async function cancelSession(sessionId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    }

    if (reason) {
      updateData.notes = `Cancelled: ${reason}`
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Error cancelling session:', error)
      return { success: false, error: 'Failed to cancel session' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in cancelSession:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Reschedule a session (server-side)
 */
export async function rescheduleSession(sessionId: string, newStartTime: string, newEndTime: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString()
    }

    if (reason) {
      updateData.notes = `Rescheduled: ${reason}`
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Error rescheduling session:', error)
      return { success: false, error: 'Failed to reschedule session' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in rescheduleSession:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Add session note (server-side)
 */
export async function addSessionNote(sessionId: string, note: string, authorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('session_notes')
      .insert({
        session_id: sessionId,
        therapist_id: authorId,
        note_content: note,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error adding session note:', error)
      return { success: false, error: 'Failed to add session note' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addSessionNote:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get session notes (server-side)
 */
export async function getSessionNotes(sessionId: string): Promise<{ notes: any[]; error?: string }> {
  try {
    const { data: notes, error } = await supabase
      .from('session_notes')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching session notes:', error)
      return { notes: [], error: 'Failed to fetch session notes' }
    }

    return { notes: notes || [] }
  } catch (error) {
    console.error('Error in getSessionNotes:', error)
    return { notes: [], error: 'Internal server error' }
  }
}
