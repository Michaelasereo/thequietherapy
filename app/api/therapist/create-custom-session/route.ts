import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

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
    if (is_instant) {
      startTimeIso = new Date().toISOString()
    } else {
      if (!session_date || !session_time) {
        return NextResponse.json({ error: 'session_date and session_time are required' }, { status: 400 })
      }
      startTimeIso = new Date(`${session_date}T${session_time}:00.000Z`).toISOString()
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

    const { data: created, error: insertErr } = await supabase
      .from('sessions')
      .insert(insertPayload)
      .select()
      .single()

    if (insertErr) {
      console.error('Error creating custom session:', insertErr)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: created })
  } catch (err) {
    console.error('Create custom session error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { successResponse, handleApiError } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CreateCustomSessionRequest {
  patient_id: string
  session_date?: string // Optional for instant sessions
  session_time?: string // Optional for instant sessions
  duration_minutes?: number
  session_type?: 'video' | 'audio' | 'chat'
  notes?: string
  title?: string
  is_instant?: boolean // If true, session can start immediately after approval
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate therapist
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const therapistId = session.user.id

    // 2. Parse request body
    const body: CreateCustomSessionRequest = await request.json()
    const {
      patient_id,
      session_date,
      session_time,
      duration_minutes = 30,
      session_type = 'video',
      notes = '',
      title,
      is_instant = false
    } = body

    // 3. Validate required fields
    if (!patient_id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // 4. Validate patient exists
    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('id, full_name, email, user_type')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // 5. Calculate session times
    let startDateTime: Date
    let endDateTime: Date
    let scheduledDate: string | null = null
    let scheduledTime: string | null = null

    if (is_instant) {
      // For instant sessions, start time is now
      startDateTime = new Date()
      endDateTime = new Date(startDateTime.getTime() + duration_minutes * 60000)
      scheduledDate = startDateTime.toISOString().split('T')[0]
      scheduledTime = startDateTime.toTimeString().slice(0, 5) // HH:MM format
    } else {
      // For scheduled sessions, validate date/time
      if (!session_date || !session_time) {
        return NextResponse.json(
          { error: 'Session date and time are required for scheduled sessions' },
          { status: 400 }
        )
      }

      scheduledDate = session_date
      scheduledTime = session_time.includes(':') && session_time.split(':').length === 2
        ? `${session_time}:00`
        : session_time

      // Create datetime with GMT+1 timezone
      startDateTime = new Date(`${session_date}T${scheduledTime}+01:00`)
      endDateTime = new Date(startDateTime.getTime() + duration_minutes * 60000)

      // Validate session is in the future
      const now = new Date()
      if (startDateTime <= now) {
        return NextResponse.json(
          { error: 'Scheduled sessions must be in the future' },
          { status: 400 }
        )
      }
    }

    // 6. Create session with pending_approval status
    const sessionData = {
      user_id: patient_id,
      therapist_id: therapistId,
      title: title || `Session with ${patient.full_name}`,
      description: notes,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration_minutes: duration_minutes,
      duration: duration_minutes, // Legacy field
      session_type: session_type,
      status: 'pending_approval',
      requires_approval: true,
      is_instant: is_instant,
      created_by: therapistId,
      notes: notes || `Custom session created by therapist`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📅 Creating custom session:', sessionData)

    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating session:', createError)
      console.error('❌ Error code:', createError.code)
      console.error('❌ Error details:', createError.details)
      console.error('❌ Error hint:', createError.hint)
      
      // Check if it's a constraint violation (missing pending_approval status)
      if (createError.code === '23514' || createError.message?.includes('check constraint')) {
        return NextResponse.json(
          { 
            error: 'Database schema not updated. Please run add-session-approval-system.sql first.',
            details: 'The pending_approval status is not allowed. Run the migration script.',
            code: createError.code
          },
          { status: 500 }
        )
      }
      
      // Check if it's a missing column error
      if (createError.message?.includes('column') && createError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema not updated. Missing required columns.',
            details: createError.message,
            hint: 'Run add-session-approval-system.sql to add missing columns (is_instant, requires_approval, created_by)'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create session',
          details: createError.message,
          code: createError.code,
          hint: createError.hint
        },
        { status: 500 }
      )
    }

    // 7. Create Daily.co room for instant sessions (so it's ready when approved)
    if (is_instant) {
      try {
        const { createTherapySessionRoom } = await import('@/lib/daily')
        const { data: therapist } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', therapistId)
          .single()

        const room = await createTherapySessionRoom({
          sessionId: newSession.id,
          therapistName: therapist?.full_name || 'Therapist',
          patientName: patient.full_name,
          duration: duration_minutes,
          scheduledTime: startDateTime
        })

        // Update session with room URL
        await supabase
          .from('sessions')
          .update({ 
            session_url: room.url,
            room_name: room.name
          })
          .eq('id', newSession.id)

        console.log('✅ Daily.co room created for instant session:', room.name)
      } catch (roomError) {
        console.error('❌ Failed to create Daily.co room:', roomError)
        // Don't fail the session creation if room creation fails
      }
    }

    console.log('✅ Custom session created successfully:', newSession.id)

    return successResponse({
      session: newSession,
      message: is_instant 
        ? 'Instant session created. Patient will be notified to approve.' 
        : 'Custom session created. Patient will be notified to approve.'
    })

  } catch (error) {
    console.error('❌ Error creating custom session:', error)
    return handleApiError(error)
  }
}

