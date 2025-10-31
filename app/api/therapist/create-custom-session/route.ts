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
