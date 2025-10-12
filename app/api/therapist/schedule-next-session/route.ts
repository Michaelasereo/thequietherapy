import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📅 Received request body:', body)
    
    const { 
      therapistId, 
      patientId, 
      scheduledDate, 
      scheduledTime, 
      durationMinutes,
      notes,
      previousSessionId 
    } = body

    // Validate required fields
    if (!therapistId || !patientId || !scheduledDate || !scheduledTime) {
      console.error('❌ Missing required fields:', { therapistId, patientId, scheduledDate, scheduledTime })
      return NextResponse.json(
        { error: 'Missing required fields', received: { therapistId, patientId, scheduledDate, scheduledTime } },
        { status: 400 }
      )
    }

    console.log('📅 Scheduling next session:', {
      therapistId,
      patientId,
      scheduledDate,
      scheduledTime,
      durationMinutes
    })

    // Get therapist and patient data
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', therapistId)
      .single()

    if (therapistError) {
      console.error('❌ Error fetching therapist:', therapistError)
    }

    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', patientId)
      .single()

    if (patientError) {
      console.error('❌ Error fetching patient:', patientError)
    }

    if (!therapist || !patient) {
      console.error('❌ Therapist or patient not found:', { therapist, patient })
      return NextResponse.json(
        { error: 'Therapist or patient not found', details: { therapist: !!therapist, patient: !!patient } },
        { status: 404 }
      )
    }

    console.log('✅ Found therapist and patient:', {
      therapist: therapist.full_name,
      patient: patient.full_name
    })

    // Validate the date is not too far in the future
    const selectedDate = new Date(scheduledDate);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 21); // 21 days from today for therapists
    
    if (selectedDate < today) {
      return NextResponse.json({
        error: 'Cannot schedule sessions in the past'
      }, { status: 400 });
    }
    
    if (selectedDate > maxDate) {
      return NextResponse.json({
        error: 'Cannot schedule sessions more than 21 days in advance'
      }, { status: 400 });
    }
    
    // Format time to match existing booking API format
    const duration = durationMinutes || 30;
    
    // Ensure time is HH:MM format, then add seconds and timezone
    const timeWithSeconds = scheduledTime.includes(':') && scheduledTime.split(':').length === 2 
      ? `${scheduledTime}:00` 
      : scheduledTime;
    
    // Create datetime objects with GMT+1 timezone (matching existing booking API)
    const startDateTime = new Date(`${scheduledDate}T${timeWithSeconds}+01:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    console.log('📅 Time formatting:', {
      input: scheduledTime,
      timeWithSeconds,
      scheduledDate,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    });

    // Create the session with all required fields
    const sessionData = {
      user_id: patientId,
      therapist_id: therapistId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      scheduled_date: scheduledDate,
      scheduled_time: timeWithSeconds,
      duration: duration,
      status: 'scheduled',
      title: `Follow-up Session - ${patient.full_name}`,
      notes: notes || ''
    }

    console.log('📅 Creating session with data:', sessionData)

    const { data: newSession, error: createError} = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating session:', createError)
      console.error('❌ Error details:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to create session', 
          details: createError.message,
          hint: createError.hint,
          code: createError.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Next session created:', newSession.id)

    // TODO: Send email notification to patient
    // You can add email notification here using your email service

    return NextResponse.json({
      success: true,
      sessionId: newSession.id,
      session: newSession,
      message: 'Next session scheduled successfully'
    })

  } catch (error) {
    console.error('❌❌❌ CRITICAL ERROR in schedule next session API:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error details:', error)
    
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to schedule next session',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        stringified: JSON.stringify(error, null, 2)
      },
      { status: 500 }
    )
  }
}

