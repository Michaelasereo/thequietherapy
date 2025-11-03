import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { ValidationError, ConflictError, NotFoundError, successResponse, validateRequired } from '@/lib/api-response'
import { handleApiError } from '@/lib/api-response'
import { createRequestId, addRequestIdHeader, logWithRequestId } from '@/lib/log-request-id'
import { trackApiCall } from '@/lib/monitoring'
import { canBookTimeSlot, isTestTherapist, getTestTime } from '@/lib/dev-time-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for better type safety
interface BookingRequest {
  therapist_id: string
  session_date: string // YYYY-MM-DD
  start_time: string // HH:MM
  duration?: number // minutes, default 30
  session_type?: 'video' | 'audio' | 'chat'
  notes?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = createRequestId();
  
  try {
    // 1. SECURE Authentication Check - verify server-side session
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return addRequestIdHeader(NextResponse.json(authResult.error, { status: 401 }), requestId)
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
      duration = 30, // Default to 30 minutes for therapy session
      session_type = 'video',
      notes = ''
    } = requestData

    logWithRequestId(requestId, 'info', 'Processing booking request', {
      therapist_id,
      session_date,
      start_time,
      duration
    })
    
    console.log('🔍 DEBUG: Therapist ID type:', typeof therapist_id)
    console.log('🔍 DEBUG: Therapist ID value:', therapist_id)

    // 3. Validate therapist exists and is available
    console.log('🔍 DEBUG: Looking for therapist with ID:', therapist_id)
    
    // First, get the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, user_type, is_active, is_verified')
      .eq('id', therapist_id)
      .eq('user_type', 'therapist')
      .eq('is_active', true)
      .eq('is_verified', true)
      .single()

    if (userError || !user) {
      console.error('❌ User query error:', userError)
      throw new NotFoundError('Therapist not found or not available')
    }

    console.log('✅ User found:', user.email)

    // Then check therapist_enrollments for approval status (source of truth)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('id, status, is_active')
      .eq('email', user.email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('❌ Enrollment query error:', enrollmentError)
      throw new NotFoundError('Therapist not found or not available')
    }

    console.log('✅ Therapist enrollment verified:', enrollment.status)

    // Use user data as therapist data
    const therapist = {
      id: user.id,
      full_name: user.full_name,
      email: user.email
    }

    console.log('✅ Therapist found:', therapist.full_name)

    // 4. Check if user has available credits (check both 'individual' and 'user' types)
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .in('user_type', ['individual', 'user'])
      .gt('credits_balance', 0)

    console.log('🔍 DEBUG: Credit check results:', {
      userId,
      userCredits,
      creditsError,
      creditsFound: userCredits?.length || 0
    })

    if (creditsError) {
      console.error('❌ Error checking user credits:', creditsError)
      throw new Error('Error checking user credits')
    }

    if (!userCredits || userCredits.length === 0) {
      throw new ValidationError('You need to purchase a session package before booking. Please buy credits first.')
    }

    // 5. Create session datetime objects with GMT+1 timezone
    const sessionDateTime = new Date(`${session_date}T${start_time}:00+01:00`)
    const sessionEndTime = new Date(sessionDateTime.getTime() + duration * 60000)

    // 🚀 DEVELOPMENT BYPASS: Allow immediate booking for test therapists
    if (process.env.NODE_ENV === 'development' && isTestTherapist(therapist_id)) {
      console.log('🚀 Development mode: Bypassing time validation for test therapist');
    } else {
      // Validate session is in the future (with timezone consideration)
      const now = getTestTime() // Use test time in development
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const sessionDate = new Date(session_date)
      
      console.log('🔍 DEBUG: Date validation:', {
        session_date,
        start_time,
        sessionDateTime: sessionDateTime.toISOString(),
        now: now.toISOString(),
        today: today.toISOString(),
        sessionDate: sessionDate.toISOString(),
        isToday: sessionDate.getTime() === today.getTime(),
        isPast: sessionDate < today
      })

      // Allow booking for today if the time is in the future, or any future date
      if (sessionDate < today) {
        throw new ValidationError('Cannot book sessions for past dates')
      }
      
      // If booking for today, check if the time is in the future
      if (sessionDate.getTime() === today.getTime()) {
        const currentTime = getTestTime()
        const sessionTime = new Date(`${session_date}T${start_time}:00+01:00`)
        
        // Use development time utilities for validation
        if (!canBookTimeSlot(sessionTime)) {
          throw new ValidationError('Cannot book sessions in the past. Please select a future time slot.')
        }
      }
    }

    // 6. Check for scheduling conflicts using AvailabilityManager
    console.log('🔍 DEBUG: Checking availability using AvailabilityManager:', {
      session_date,
      start_time,
      userId,
      therapist_id
    })
    
    const { AvailabilityManager } = await import('@/lib/availability-manager')
    const availabilityManager = new AvailabilityManager()
    
    const availabilityCheck = await availabilityManager.isSlotAvailable(
      therapist_id,
      session_date,
      start_time,
      duration
    )

    console.log('🔍 DEBUG: Availability check results:', {
      available: availabilityCheck.available,
      conflicts: availabilityCheck.conflicts
    })

    if (!availabilityCheck.available) {
      const conflictMessage = availabilityCheck.conflicts
        .map(c => c.message)
        .join('; ')
      console.log('❌ Availability conflicts found:', conflictMessage)
      throw new ConflictError(`Time slot is not available: ${conflictMessage}`)
    }

    // 7. Availability already verified by AvailabilityManager in step 6
    console.log('✅ Therapist availability confirmed by AvailabilityManager')

    // 8. Create the session atomically with credit deduction and notifications
    console.log('🔍 Creating session atomically with credit deduction...')
    const { data: createdSessions, error: rpcError } = await supabase
      .rpc('create_session_with_credit_deduction', {
        p_user_id: userId,
        p_therapist_id: therapist_id,
        p_session_date: session_date,
        p_session_time: start_time,
        p_duration_minutes: duration,
        p_session_type: session_type,
        p_notes: notes || `Booking by ${userName} (${userEmail})`,
        p_title: `Therapy Session - ${userName}`
      })

    if (rpcError) {
      // Map known constraint and business errors to proper responses
      const msg = rpcError.message || ''
      if (msg.includes('Booking conflict') || msg.includes('sessions_no_overlap_per_therapist')) {
        throw new ConflictError('This time slot is no longer available')
      }
      if (msg.includes('Insufficient credits') || msg.includes('Failed to deduct credits')) {
        throw new ValidationError('Insufficient credits to book session')
      }
      console.error('❌ Atomic booking error:', rpcError)
      // Return detailed error in development for faster debugging
      const devBody = {
        error: 'Failed to create session',
        details: msg,
      }
      return addRequestIdHeader(NextResponse.json(devBody, { status: 500 }), requestId)
    }

    const sessionRecord = Array.isArray(createdSessions) ? createdSessions[0] : createdSessions
    const sessionId = sessionRecord?.id
    if (!sessionId) {
      throw new Error('Failed to create session')
    }

    // 9. Create Daily.co room for the session
    try {
      const { createTherapySessionRoom } = await import('@/lib/daily')
      const room = await createTherapySessionRoom({
        sessionId: sessionId,
        therapistName: therapist.full_name,
        patientName: userName,
        duration: duration,
        scheduledTime: sessionDateTime
      })

      // Update session with room URL
      await supabase
        .from('sessions')
        .update({ 
          session_url: room.url,
          room_name: room.name
        })
        .eq('id', sessionId)

      console.log('✅ Daily.co room created:', room.name)
    } catch (roomError) {
      console.error('❌ Failed to create Daily.co room:', roomError)
      // Don't fail the booking if room creation fails
    }

    // 10. Credit deduction handled atomically inside the SQL function

    // 11. TODO: Send confirmation emails/notifications
    // await sendBookingConfirmation(user, therapist, session)

    console.log('✅ Session booked successfully:', sessionId)

    // Track successful booking
    trackApiCall('/api/sessions/book', true)
    
    return successResponse({
      session: {
        ...sessionRecord,
        therapist_name: therapist.full_name,
        therapist_email: therapist.email
      }
    })

  } catch (error) {
    // Track failed booking
    trackApiCall('/api/sessions/book', false, error)
    return handleApiError(error)
  }
}

// GET endpoint for retrieving user sessions
export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication Check
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: 401 })
    }

    const { session } = authResult
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items

    let query = supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', session.user.id) // Use verified user ID from session
      .order('start_time', { ascending: true })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      throw new Error('Failed to fetch sessions')
    }

    return successResponse({
      sessions: sessions || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}