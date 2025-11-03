import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { AvailabilityManager } from '@/lib/availability-manager'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const therapistId = session.user.id

    const body = await request.json()
    const {
      patient_id,
      session_date, // YYYY-MM-DD optional for instant
      session_time, // HH:mm optional for instant
      duration_minutes = 30,
      session_type = 'video',
      notes = '',
      title,
      is_instant = false
    } = body

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine schedule
    let startTimeIso: string | null = null
    let endTimeIso: string | null = null
    
    if (is_instant) {
      // For instant sessions: you can join anytime until expiration
      // Set start_time to creation time (but allow joining anytime before end_time)
      // Set end_time to creation time + duration (this is the deadline to join/complete)
      const now = new Date()
      startTimeIso = now.toISOString() // Creation time
      endTimeIso = new Date(now.getTime() + duration_minutes * 60000).toISOString() // Join deadline
    } else {
      if (!session_date || !session_time) {
        return NextResponse.json({ error: 'session_date and session_time are required' }, { status: 400 })
      }
      // Use GMT+1 timezone to match other booking APIs
      const startDateTime = new Date(`${session_date}T${session_time}:00+01:00`)
      startTimeIso = startDateTime.toISOString()
      endTimeIso = new Date(startDateTime.getTime() + duration_minutes * 60000).toISOString()
    }

    // Create session with pending approval
    const insertPayload: any = {
      user_id: patient_id,
      therapist_id: therapistId,
      status: 'pending_approval',
      requires_approval: true,
      is_instant: !!is_instant,
      created_by: therapistId,
      start_time: startTimeIso,
      end_time: endTimeIso,
      duration_minutes,
      session_type,
      notes,
      title: title || 'Therapy Session'
    }

    // Optional: set scheduled_date/time fields if your schema uses them
    if (!is_instant && session_date && session_time) {
      insertPayload.scheduled_date = session_date
      insertPayload.scheduled_time = session_time
    }

    // Check availability before creating session (only for scheduled sessions)
    if (!is_instant && session_date && session_time) {
      console.log('🔍 Checking availability before creating session...')
      
      // Enhanced: Check for time slot conflicts with detailed information
      const startDateTime = new Date(`${session_date}T${session_time}:00+01:00`)
      const startTimeIso = startDateTime.toISOString()
      const endTimeIso = new Date(startDateTime.getTime() + duration_minutes * 60000).toISOString()

      // Direct database check for overlapping sessions
      // Query for sessions that overlap: session.start <= requested.end AND session.end >= requested.start
      const { data: allSessions, error: conflictError } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          end_time,
          status,
          users:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('therapist_id', therapistId)
        .not('status', 'in', '("cancelled","completed","no_show")')
        .lte('start_time', endTimeIso)
        .gte('end_time', startTimeIso)

      // Filter overlapping sessions in memory for more precise matching
      const conflictingSessions = allSessions?.filter(session => {
        const sessionStart = new Date(session.start_time)
        const sessionEnd = new Date(session.end_time)
        // Check if sessions overlap: session starts before requested ends AND session ends after requested starts
        return sessionStart <= endTime && sessionEnd >= startDateTime
      }) || []

      if (conflictError) {
        console.error('❌ Conflict check error:', conflictError)
        // Don't fail the booking if conflict check fails - continue with AvailabilityManager check
      }

      if (conflictingSessions && conflictingSessions.length > 0) {
        console.log('🚨 Time slot conflict detected:', {
          requested: { start: startTimeIso, end: endTimeIso },
          conflicts: conflictingSessions.map(c => ({
            id: c.id,
            start: c.start_time,
            end: c.end_time,
            status: c.status,
            user: c.users?.full_name
          }))
        })

        return NextResponse.json({ 
          error: 'Time slot is already booked',
          details: 'Booking conflict: Time slot is already booked',
          code: 'TIME_SLOT_CONFLICT',
          conflicting_sessions: conflictingSessions.map(c => ({
            id: c.id,
            start_time: c.start_time,
            end_time: c.end_time,
            status: c.status,
            user_name: c.users?.full_name || 'Unknown User',
            user_email: c.users?.email
          })),
          suggested_actions: [
            'Choose a different time',
            'Contact the existing client to reschedule',
            'Try adding buffer time between sessions'
          ]
        }, { status: 409 })
      }

      // Also use AvailabilityManager for comprehensive check
      const availabilityManager = new AvailabilityManager()
      const availabilityCheck = await availabilityManager.isSlotAvailable(
        therapistId,
        session_date,
        session_time,
        duration_minutes
      )

      if (!availabilityCheck.available) {
        const conflictMessage = availabilityCheck.conflicts
          .map(c => c.message)
          .join('; ')
        console.log('❌ Availability conflicts found:', conflictMessage)
        return NextResponse.json({ 
          error: 'Time slot is not available',
          details: conflictMessage,
          code: 'AVAILABILITY_CONFLICT',
          conflicts: availabilityCheck.conflicts.map(c => ({
            type: c.type,
            message: c.message
          }))
        }, { status: 409 })
      }
      console.log('✅ Availability confirmed')
    }

    console.log('📝 Creating custom session with payload:', {
      user_id: insertPayload.user_id,
      therapist_id: insertPayload.therapist_id,
      status: insertPayload.status,
      start_time: insertPayload.start_time,
      end_time: insertPayload.end_time,
      duration_minutes: insertPayload.duration_minutes,
      is_instant: insertPayload.is_instant
    })

    const { data: created, error: insertErr } = await supabase
      .from('sessions')
      .insert(insertPayload)
      .select()
      .single()

    if (insertErr) {
      console.error('❌ Error creating custom session:', {
        error: insertErr,
        code: insertErr.code,
        message: insertErr.message,
        details: insertErr.details,
        hint: insertErr.hint
      })
      
      // Handle booking conflict from database trigger (P0001 is a PostgreSQL error code)
      if (insertErr.code === 'P0001' || insertErr.message?.includes('Booking conflict') || insertErr.message?.includes('already booked')) {
        console.log('🚨 Database trigger detected conflict, fetching conflict details...')
        
        // Fetch conflicting sessions details since the trigger detected the conflict
        // Use already calculated startTimeIso and endTimeIso from earlier in the function
        if (!startTimeIso || !endTimeIso) {
          // Fallback: Recalculate if needed (shouldn't happen)
          const fallbackStart = session_date && session_time 
            ? new Date(`${session_date}T${session_time}:00+01:00`).toISOString()
            : new Date().toISOString()
          const fallbackEnd = new Date(new Date(fallbackStart).getTime() + duration_minutes * 60000).toISOString()
          
          return NextResponse.json({ 
            error: 'Time slot is already booked',
            details: insertErr.message || 'Booking conflict: Time slot is already booked',
            code: 'TIME_SLOT_CONFLICT',
            conflicting_sessions: [],
            suggested_actions: [
              'Choose a different time',
              'Contact the existing client to reschedule',
              'Try adding buffer time between sessions'
            ]
          }, { status: 409 })
        }

        const { data: conflictingSessions } = await supabase
          .from('sessions')
          .select(`
            id,
            start_time,
            end_time,
            status,
            users:user_id (
              id,
              email,
              full_name
            )
          `)
          .eq('therapist_id', therapistId)
          .not('status', 'in', '("cancelled","completed","no_show")')
          .lte('start_time', endTimeIso)
          .gte('end_time', startTimeIso)

        // Filter overlapping sessions
        const activeConflicts = conflictingSessions?.filter(session => {
          if (['cancelled', 'completed', 'no_show'].includes(session.status)) {
            return false
          }
          const sessionStart = new Date(session.start_time)
          const sessionEnd = new Date(session.end_time)
          const requestedStart = new Date(startTimeIso)
          const requestedEnd = new Date(endTimeIso)
          return sessionStart <= requestedEnd && sessionEnd >= requestedStart
        }) || []

        console.log('📊 Conflicting sessions found:', activeConflicts.length)

        return NextResponse.json({ 
          error: 'Time slot is already booked',
          details: insertErr.message || 'Booking conflict: Time slot is already booked',
          code: 'TIME_SLOT_CONFLICT',
          conflicting_sessions: activeConflicts.map(c => ({
            id: c.id,
            start_time: c.start_time,
            end_time: c.end_time,
            status: c.status,
            user_name: c.users?.full_name || 'Unknown User',
            user_email: c.users?.email
          })),
          suggested_actions: [
            'Choose a different time',
            'Contact the existing client to reschedule',
            'Try adding buffer time between sessions'
          ]
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: insertErr.message,
        code: insertErr.code,
        hint: insertErr.hint
      }, { status: 500 })
    }

    console.log('✅ Successfully created custom session:', created?.id)

    return NextResponse.json({ success: true, session: created })
  } catch (err) {
    console.error('❌ Create custom session error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    const errorStack = err instanceof Error ? err.stack : undefined
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}
