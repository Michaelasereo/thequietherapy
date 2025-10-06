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
  duration?: number // minutes, default 60
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
      duration = 60, // Default to 60 minutes for therapy session
      session_type = 'video',
      notes = ''
    } = requestData

    console.log('🔄 Processing booking request:', {
      userId,
      userEmail,
      therapist_id,
      session_date,
      start_time
    })

    // 3. Validate therapist exists and is available
    console.log('🔍 Validating therapist:', therapist_id)
    
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
          is_verified
        )
      `)
      .eq('id', therapist_id)
      .eq('user_type', 'therapist')
      .eq('is_active', true)
      .eq('is_verified', true)
      .eq('therapist_profiles.verification_status', 'approved')
      .single()

    if (therapistError || !therapist) {
      console.error('❌ Therapist validation failed:', therapistError)
      throw new NotFoundError('Therapist not found or not available for bookings')
    }

    console.log('✅ Therapist validated:', therapist.full_name)

    // 4. PROPER CREDIT VALIDATION (NO TESTING CODE)
    console.log('🔍 Validating user credits...')
    
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_balance, credits_used')
      .eq('user_id', userId)
      .in('user_type', ['individual', 'user'])
      .gt('credits_balance', 0)
      .single()

    if (creditsError || !userCredits) {
      console.error('❌ Credit validation failed:', creditsError)
      throw new ValidationError('You need to purchase a session package before booking. Please buy credits first.')
    }

    if (userCredits.credits_balance < 1) {
      throw new ValidationError('Insufficient credits. You need at least 1 credit to book a session.')
    }

    console.log('✅ User has sufficient credits:', userCredits.credits_balance)

    // 5. Validate session is in the future
    const sessionDateTime = new Date(`${session_date}T${start_time}:00Z`) // Use UTC
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sessionDate = new Date(session_date)
    
    console.log('🔍 Date validation:', {
      session_date,
      start_time,
      sessionDateTime: sessionDateTime.toISOString(),
      now: now.toISOString(),
      isPast: sessionDate < today
    })

    // Allow booking for today if the time is in the future, or any future date
    if (sessionDate < today) {
      throw new ValidationError('Cannot book sessions for past dates')
    }
    
    // If booking for today, check if the time is in the future
    if (sessionDate.getTime() === today.getTime()) {
      const currentTime = new Date()
      const sessionTime = new Date(`${session_date}T${start_time}:00Z`)
      
      // Add a 30-minute buffer to account for timezone differences
      const bufferTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
      
      if (sessionTime <= bufferTime) {
        throw new ValidationError('Cannot book sessions in the past. Please select a future time slot.')
      }
    }

    // 6. DATABASE-LEVEL CONFLICT PREVENTION
    console.log('🔍 Checking for booking conflicts...')
    
    // Use the database function to check for conflicts
    const { data: conflictCheck, error: conflictError } = await supabase
      .rpc('check_booking_conflict', {
        p_therapist_id: therapist_id,
        p_session_date: session_date,
        p_start_time: start_time,
        p_end_time: `${start_time.split(':')[0]}:${String(parseInt(start_time.split(':')[1]) + duration).padStart(2, '0')}`
      })

    if (conflictError) {
      console.error('❌ Conflict check failed:', conflictError)
      throw new Error('Unable to verify slot availability')
    }

    if (conflictCheck) {
      throw new ConflictError('This time slot is no longer available. Please select a different time.')
    }

    console.log('✅ No conflicts found, proceeding with booking')

    // 7. ATOMIC BOOKING WITH CREDIT DEDUCTION
    console.log('🔍 Creating session with atomic credit deduction...')
    
    // Use a database transaction to ensure atomicity
    const { data: sessionRecord, error: sessionError } = await supabase
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

    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    const sessionId = sessionRecord.id
    console.log('✅ Session created with ID:', sessionId)

    // 8. Create Daily.co room for the session
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

    // 9. Send confirmation notifications (TODO: implement)
    // await sendBookingConfirmation(user, therapist, session)

    console.log('✅ Session booked successfully:', sessionId)

    return successResponse({
      session: {
        ...sessionRecord,
        therapist_name: therapist.full_name,
        therapist_email: therapist.email
      }
    })

  } catch (error) {
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
