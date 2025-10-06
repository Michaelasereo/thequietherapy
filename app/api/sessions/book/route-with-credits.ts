import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, ConflictError, NotFoundError, successResponse, validateRequired } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for better type safety
interface BookingRequest {
  therapist_id: string
  session_date: string // YYYY-MM-DD
  start_time: string // HH:MM
  session_type?: 'video' | 'audio' | 'chat'
  notes?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. SECURE Authentication Check - verify server-side session
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 })
    }

    const { session } = authResult
    const userId = session.user.id // This is now TRUSTED and verified
    const userEmail = session.user.email
    const userName = session.user.full_name

    // 2. Parse and validate request
    const requestData: BookingRequest = await request.json()
    
    // Use centralized validation
    validateRequired(requestData, ['therapist_id', 'session_date', 'start_time'])
    
    const {
      therapist_id,
      session_date,
      start_time,
      session_type = 'video',
      notes = ''
    } = requestData

    console.log('🔄 Processing booking request:', {
      userId,
      therapist_id,
      session_date,
      start_time
    })

    // 3. Check user's available credits and determine session details
    const { data: availableCredits, error: creditsError } = await supabase
      .rpc('get_available_credits', { p_user_id: userId })

    if (creditsError) {
      console.error('Error checking credits:', creditsError)
      throw new Error('Failed to check available credits')
    }

    if (!availableCredits || availableCredits.length === 0) {
      throw new ConflictError('No session credits available. Please purchase a package to book sessions.', {
        redirect_to: '/dashboard/continue-journey'
      })
    }

    // Use the first available credit (free credits are returned first)
    const creditToUse = availableCredits[0]
    const sessionDuration = creditToUse.session_duration_minutes
    const isFreeSession = creditToUse.is_free_credit

    console.log('💳 Using credit:', {
      creditId: creditToUse.credit_id,
      duration: sessionDuration,
      isFree: isFreeSession
    })

    // 4. Validate therapist exists and is available
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        user_type,
        is_active,
        is_verified,
        therapist_profiles!inner (
          verification_status,
          availability_status
        )
      `)
      .eq('id', therapist_id)
      .eq('user_type', 'therapist')
      .eq('is_active', true)
      .eq('is_verified', true)
      .eq('therapist_profiles.verification_status', 'verified')
      .single()

    if (therapistError || !therapist) {
      throw new NotFoundError('Therapist not found or not available')
    }

    // 5. Create session datetime objects
    const sessionDateTime = new Date(`${session_date}T${start_time}:00`)
    const sessionEndTime = new Date(sessionDateTime.getTime() + sessionDuration * 60000)

    // Validate session is in the future
    if (sessionDateTime <= new Date()) {
      throw new ValidationError('Cannot book sessions in the past')
    }

    // 6. Check for scheduling conflicts
    const { data: conflictingSessions, error: conflictError } = await supabase
      .from('sessions')
      .select('id, start_time, end_time')
      .eq('therapist_id', therapist_id)
      .eq('status', 'scheduled')
      .gte('start_time', sessionDateTime.toISOString())
      .lt('start_time', sessionEndTime.toISOString())

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      throw new Error('Failed to check scheduling conflicts')
    }

    if (conflictingSessions && conflictingSessions.length > 0) {
      throw new ConflictError('This time slot is no longer available')
    }

    // 7. Generate unique session ID and Daily.co room
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const dailyRoomName = `${therapist.full_name?.replace(/\s+/g, '-')}-${sessionId}`.toLowerCase()

    // 8. Create the session in a transaction
    const { data: createdSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        therapist_id: therapist_id,
        therapist_name: therapist.full_name,
        therapist_email: therapist.email,
        patient_name: userName,
        patient_email: userEmail,
        title: `Therapy Session - ${userName}`,
        description: notes || `${isFreeSession ? 'Free' : 'Paid'} therapy session`,
        scheduled_date: session_date,
        scheduled_time: start_time,
        start_time: sessionDateTime.toISOString(),
        end_time: sessionEndTime.toISOString(),
        planned_duration_minutes: sessionDuration,
        session_type: session_type,
        status: 'scheduled',
        is_free_session: isFreeSession,
        daily_room_name: dailyRoomName,
        daily_room_url: `https://trpi.daily.co/${dailyRoomName}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    // 9. Use the credit (mark it as used)
    const { error: creditUseError } = await supabase
      .rpc('use_credit', { 
        p_credit_id: creditToUse.credit_id, 
        p_session_id: sessionId 
      })

    if (creditUseError) {
      console.error('Error using credit:', creditUseError)
      // Try to cleanup the session
      await supabase.from('sessions').delete().eq('id', sessionId)
      throw new Error('Failed to process session credit')
    }

    // 10. Update session with credit reference
    await supabase
      .from('sessions')
      .update({ credit_used_id: creditToUse.credit_id })
      .eq('id', sessionId)

    console.log('✅ Session booked successfully:', {
      sessionId,
      creditUsed: creditToUse.credit_id,
      isFree: isFreeSession,
      duration: sessionDuration
    })

    // 11. Return success response
    return successResponse({
      session: {
        id: createdSession.id,
        therapist_name: createdSession.therapist_name,
        scheduled_date: createdSession.scheduled_date,
        scheduled_time: createdSession.scheduled_time,
        duration_minutes: sessionDuration,
        is_free_session: isFreeSession,
        status: createdSession.status,
        daily_room_url: createdSession.daily_room_url,
        daily_room_name: createdSession.daily_room_name
      },
      message: `${isFreeSession ? 'Free' : 'Paid'} session booked successfully! Duration: ${sessionDuration} minutes.`
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/sessions/book
 * Returns user's booked sessions
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 })
    }

    const { session } = authResult
    const userId = session.user.id

    // Get user's sessions with credit information
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        therapist_name,
        therapist_email,
        scheduled_date,
        scheduled_time,
        start_time,
        end_time,
        planned_duration_minutes,
        actual_duration_minutes,
        status,
        is_free_session,
        daily_room_name,
        daily_room_url,
        created_at
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch user sessions')
    }

    return successResponse({
      sessions: sessions || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}
