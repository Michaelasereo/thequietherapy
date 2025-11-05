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

    // ✅ VALIDATION: Verify therapist_id is valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(therapist_id)) {
      throw new ValidationError('Invalid therapist ID format')
    }
    
    // ✅ VALIDATION: Verify date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(session_date)) {
      throw new ValidationError('Invalid date format. Use YYYY-MM-DD')
    }
    
    // ✅ VALIDATION: Verify time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(start_time)) {
      throw new ValidationError('Invalid time format. Use HH:MM (24-hour format)')
    }
    
    // ✅ VALIDATION: Verify duration is positive and reasonable
    if (duration < 15 || duration > 180) {
      throw new ValidationError('Duration must be between 15 and 180 minutes')
    }

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
    // Handle duplicates by getting the most recent approved enrollment
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('id, status, is_active, created_at')
      .eq('email', user.email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.error('❌ Enrollment query error:', enrollmentError)
      
      // Check if there are any enrollments at all (for better error message)
      const { data: allEnrollments } = await supabase
        .from('therapist_enrollments')
        .select('id, status, is_active')
        .eq('email', user.email)
      
      if (allEnrollments && allEnrollments.length > 0) {
        const pendingEnrollments = allEnrollments.filter(e => e.status === 'pending')
        const inactiveEnrollments = allEnrollments.filter(e => !e.is_active)
        
        if (pendingEnrollments.length > 0) {
          console.error('❌ Therapist enrollment is pending approval')
          throw new NotFoundError('Therapist enrollment is pending admin approval')
        } else if (inactiveEnrollments.length > 0) {
          console.error('❌ Therapist enrollment is not active')
          throw new NotFoundError('Therapist enrollment is not active')
        }
      }
      
      throw new NotFoundError('Therapist not found or not available')
    }

    // If there are multiple enrollments, warn about duplicates
    const { data: allEnrollments } = await supabase
      .from('therapist_enrollments')
      .select('id, status')
      .eq('email', user.email)

    if (allEnrollments && allEnrollments.length > 1) {
      console.warn(`⚠️ Found ${allEnrollments.length} enrollments for ${user.email}. Using most recent approved one.`)
    }

    const enrollment = enrollments[0]
    console.log('✅ Therapist enrollment verified:', enrollment.status)

    // Use user data as therapist data
    const therapist = {
      id: user.id,
      full_name: user.full_name,
      email: user.email
    }

    console.log('✅ Therapist found:', therapist.full_name)

    // 4. Check if user has available credits
    // Query user_credits table directly - get ALL credits for user regardless of user_type
    // This handles cases where credits might be stored with 'user', 'individual', or any other type
    logWithRequestId(requestId, 'info', 'Checking user credits', { userId })
    
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_balance, user_type')
      .eq('user_id', userId)
      // Don't filter by user_type - get ALL credits for this user regardless of type
      // This ensures we find credits even if they're stored with unexpected user_type values

    if (creditsError) {
      console.error('❌ Error checking user credits:', creditsError)
      logWithRequestId(requestId, 'error', 'Credit check failed', { error: creditsError.message })
      throw new Error('Error checking user credits')
    }

    // Calculate total credits from all matching records (sum all credits regardless of user_type)
    const totalCredits = userCredits && userCredits.length > 0
      ? userCredits.reduce((sum: number, credit: any) => {
          const balance = credit.credits_balance || 0
          return sum + balance
        }, 0)
      : 0

    console.log('🔍 DEBUG: Credit check results:', {
      userId,
      totalCredits,
      recordsFound: userCredits?.length || 0,
      creditsDetails: userCredits?.map((c: any) => ({ 
        user_type: c.user_type, 
        credits_balance: c.credits_balance 
      })) || []
    })

    if (!userCredits || userCredits.length === 0 || totalCredits < 1) {
      logWithRequestId(requestId, 'warn', 'No credits available', { userId, totalCredits, recordsFound: userCredits?.length || 0 })
      throw new ValidationError('You need to purchase a session package before booking. Please buy credits first.')
    }

    logWithRequestId(requestId, 'info', 'Credits verified', { userId, totalCredits })

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
    
    // Check availability (therapist is already validated above - skip redundant validation)
    let availabilityCheck
    try {
      availabilityCheck = await availabilityManager.isSlotAvailable(
        therapist_id,
        session_date,
        start_time,
        duration,
        true // Skip therapist validation since we already validated above
      )
    } catch (availabilityError) {
      console.error('❌ Error in availability check:', {
        error: availabilityError,
        therapist_id,
        session_date,
        start_time,
        duration,
        errorMessage: availabilityError instanceof Error ? availabilityError.message : String(availabilityError),
        errorStack: availabilityError instanceof Error ? availabilityError.stack : undefined
      })
      throw new Error(`Availability check failed: ${availabilityError instanceof Error ? availabilityError.message : String(availabilityError)}`)
    }

    console.log('🔍 DEBUG: Availability check results:', {
      available: availabilityCheck.available,
      conflicts: availabilityCheck.conflicts,
      therapist_id,
      therapist_email: user.email
    })

    if (!availabilityCheck.available) {
      const conflictMessage = availabilityCheck.conflicts
        .map(c => c.message)
        .join('; ')
      
      console.error('❌ Availability conflicts found:', {
        conflictMessage,
        therapist_id,
        therapist_email: user.email,
        conflicts: availabilityCheck.conflicts
      })
      
      // If the error is "Therapist account not found", this is a bug since we already validated
      if (conflictMessage.includes('Therapist account not found')) {
        console.error('🚨 BUG: Therapist was validated but availability check says not found!', {
          therapist_id,
          therapist_email: user.email,
          user_id: user.id
        })
        throw new ConflictError(`Therapist validation error: ${conflictMessage}. Please contact support.`)
      }
      
      throw new ConflictError(`Time slot is not available: ${conflictMessage}`)
    }

    // 7. Availability already verified by AvailabilityManager in step 6
    console.log('✅ Therapist availability confirmed by AvailabilityManager')

    // 8. Create the session atomically with credit deduction and notifications
    console.log('🔍 Creating session atomically with credit deduction...')
    const { data: createdSessions, error: bookingRpcError } = await supabase
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

    if (bookingRpcError) {
      // Map known constraint and business errors to proper responses
      const msg = bookingRpcError.message || ''
      
      // ✅ ENHANCED: Log full error details for debugging
      console.error('❌ Atomic booking error:', {
        message: bookingRpcError.message,
        code: bookingRpcError.code,
        details: bookingRpcError.details,
        hint: bookingRpcError.hint,
        fullError: JSON.stringify(bookingRpcError, null, 2)
      })
      
      // Log to console for debugging with full details
      console.error('🔍 Full RPC error details:', {
        message: bookingRpcError.message,
        code: bookingRpcError.code,
        details: bookingRpcError.details,
        hint: bookingRpcError.hint,
        fullError: JSON.stringify(bookingRpcError, null, 2)
      })
      
      // ✅ NEW: Check if it's the ambiguous column error
      if (msg.includes('ambiguous') || msg.includes('column reference') || bookingRpcError.code === '42702') {
        console.error('⚠️ AMBIGUOUS COLUMN ERROR DETECTED!')
        console.error('⚠️ This means the database function needs to be updated.')
        console.error('⚠️ Run the SQL script: fix-booking-ambiguous-id-complete.sql in Supabase SQL Editor')
        console.error('⚠️ Full error:', bookingRpcError)
      }
      
      if (msg.includes('Booking conflict') || msg.includes('sessions_no_overlap_per_therapist') || msg.includes('conflict')) {
        console.error('⚠️ Booking conflict detected:', msg)
        throw new ConflictError('This time slot is no longer available')
      }
      if (msg.includes('Insufficient credits') || msg.includes('Failed to deduct credits')) {
        console.error('⚠️ Insufficient credits detected:', msg)
        throw new ValidationError('Insufficient credits to book session. Please purchase credits first.')
      }
      if (msg.includes('Therapist not found') || msg.includes('not available')) {
        console.error('⚠️ Therapist not found:', msg)
        throw new NotFoundError('Therapist not found or not available for bookings')
      }
      
      // Return detailed error for debugging - include full error in response
      const errorBody = {
        error: 'Failed to create session',
        message: msg,
        code: bookingRpcError.code,
        details: bookingRpcError.details,
        hint: bookingRpcError.hint,
        fullError: JSON.stringify(bookingRpcError, null, 2), // ✅ Include full error for frontend console
        isAmbiguousColumnError: msg.includes('ambiguous') || msg.includes('column reference') || bookingRpcError.code === '42702',
        requestId
      }
      console.error('❌ Returning error response:', errorBody)
      return addRequestIdHeader(NextResponse.json(errorBody, { status: 500 }), requestId)
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

    // 11. Send confirmation emails to user and therapist with calendar integration
    try {
      // Get full session details for email
      const { data: fullSession, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!sessionError && fullSession) {
        // Generate calendar event
        const { generateCalendarEvent } = await import('@/lib/calendar')
        const sessionStartTime = new Date(fullSession.start_time)
        const sessionEndTime = new Date(fullSession.end_time)
        
        const calendarIcs = generateCalendarEvent({
          title: `Therapy Session with ${therapist.full_name}`,
          description: `Therapy session with ${therapist.full_name}. Please check your dashboard before the session to access the meeting room.`,
          startTime: sessionStartTime,
          endTime: sessionEndTime,
          location: 'Online - Check dashboard for meeting room',
          organizerEmail: process.env.SENDER_EMAIL || 'noreply@thequietherapy.live',
          attendeeEmails: [userEmail, therapist.email],
          reminderMinutes: 60, // 1 hour before
        })

        // Send email to user
        const { sendBookingConfirmationToUser } = await import('@/lib/email')
        await sendBookingConfirmationToUser(
          userEmail,
          userName,
          therapist.full_name,
          session_date,
          start_time,
          duration,
          session_type,
          fullSession.session_url || fullSession.daily_room_url,
          calendarIcs
        )

        // Send email to therapist
        const { sendBookingConfirmationToTherapist } = await import('@/lib/email')
        await sendBookingConfirmationToTherapist(
          therapist.email,
          therapist.full_name,
          userName,
          userEmail,
          session_date,
          start_time,
          duration,
          session_type,
          notes,
          fullSession.session_url || fullSession.daily_room_url,
          calendarIcs
        )

        console.log('✅ Confirmation emails sent to user and therapist')
      }
    } catch (emailError) {
      // Don't fail the booking if email fails
      console.error('⚠️ Failed to send confirmation emails:', emailError)
    }

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