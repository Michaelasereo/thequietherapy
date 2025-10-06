import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      user_id,
      therapist_id,
      therapist_email,
      therapist_name,
      session_date,
      start_time,
      end_time,
      duration = 60,
      session_type = 'individual',
      status = 'scheduled',
      patient_name,
      patient_email,
      patient_phone,
      complaints
    } = await request.json()

    if (!therapist_id || !session_date || !start_time || !patient_email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📅 Creating session booking:', {
      therapist_id,
      therapist_email,
      session_date,
      start_time,
      patient_email
    })

    // Create session with combined date and time
    const sessionDateTime = new Date(`${session_date}T${start_time}`)
    const sessionEndTime = end_time 
      ? new Date(`${session_date}T${end_time}`)
      : new Date(sessionDateTime.getTime() + duration * 60000)

    // Generate a unique session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create the session record (matching actual schema)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: user_id || patient_email, // Use email as fallback user ID
        therapist_id: therapist_id,
        start_time: sessionDateTime.toISOString(),
        end_time: sessionEndTime.toISOString(),
        duration: duration,
        session_type: session_type,
        status: status,
        notes: `Patient: ${patient_name} (${patient_email}), Phone: ${patient_phone || 'N/A'}, Concerns: ${complaints || 'N/A'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError)
      return NextResponse.json(
        { success: false, error: 'Failed to create session', details: sessionError.message },
        { status: 500 }
      )
    }

    console.log('✅ Session created successfully:', session.id)

    // TODO: Send confirmation emails to both patient and therapist
    // TODO: Create Daily.co room for the session
    // TODO: Add session to therapist's calendar

    return NextResponse.json({
      success: true,
      session: session,
      message: 'Session booked successfully'
    })

  } catch (error) {
    console.error('💥 Error in book-simple API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}