import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - verify server-side session
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id // This is now TRUSTED and verified
    const userEmail = session.user.email
    const userName = session.user.full_name

    const {
      therapist_id,
      therapist_name,
      therapist_email,
      session_date,
      start_time,
      end_time,
      duration = 60,
      session_type = 'individual',
      complaints = 'Sync from existing booking'
    } = await request.json()

    // Use centralized validation
    validateRequired({ therapist_id, session_date, start_time }, ['therapist_id', 'session_date', 'start_time'])

    console.log('🔄 Syncing existing booking for user:', userEmail)

    // Create session with combined date and time
    const sessionDateTime = new Date(`${session_date}T${start_time}`)
    const sessionEndTime = end_time 
      ? new Date(`${session_date}T${end_time}`)
      : new Date(sessionDateTime.getTime() + duration * 60000)

    // Generate a unique session ID
    const sessionId = `sync-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Check if session already exists for this time slot
    const { data: existingSession, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('scheduled_date', session_date)
      .eq('scheduled_time', start_time)
      .single()

    if (existingSession) {
      throw new ValidationError('Session already exists for this time slot', { existing_session_id: existingSession.id })
    }

    // Create the session record
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        therapist_id: therapist_id,
        therapist_email: therapist_email,
        therapist_name: therapist_name || 'Therapist',
        title: `Therapy Session with ${userName}`,
        description: complaints,
        scheduled_date: session_date,
        scheduled_time: start_time,
        start_time: sessionDateTime.toISOString(),
        end_time: sessionEndTime.toISOString(),
        duration_minutes: duration,
        session_type: session_type,
        status: 'scheduled',
        patient_name: userName,
        patient_email: userEmail,
        patient_phone: '', // Not available from cookie
        complaints: complaints,
        recording_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    console.log('✅ Session synced successfully:', sessionRecord.id)

    return successResponse({
      session: sessionRecord,
      message: 'Existing booking synced successfully as session record'
    })

  } catch (error) {
    return handleApiError(error)
  }
}
