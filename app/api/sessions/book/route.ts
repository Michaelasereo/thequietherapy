import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      therapistId, 
      sessionDate, 
      sessionTime, 
      sessionDuration = 60,
      sessionType = 'video',
      notes = ''
    } = await request.json()

    if (!userId || !therapistId || !sessionDate || !sessionTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if therapist is available and approved
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_auth')
      .select('is_active, is_verified, status')
      .eq('user_id', therapistId)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      )
    }

    if (therapist.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Therapist is not approved' },
        { status: 400 }
      )
    }

    if (!therapist.is_active) {
      return NextResponse.json(
        { success: false, error: 'Therapist is not currently available' },
        { status: 400 }
      )
    }

    // Check if user has enough credits
    const { data: user, error: userError } = await supabase
      .from('individual_auth')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.credits < 1) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits. Please purchase more credits.' },
        { status: 400 }
      )
    }

    // Check for scheduling conflicts
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`)
    const sessionEndTime = new Date(sessionDateTime.getTime() + sessionDuration * 60000)

    const { data: conflictingSessions, error: conflictError } = await supabase
      .from('sessions')
      .select('*')
      .or(`therapist_id.eq.${therapistId},user_id.eq.${userId}`)
      .gte('start_time', sessionDateTime.toISOString())
      .lt('start_time', sessionEndTime.toISOString())

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { success: false, error: 'Error checking availability' },
        { status: 500 }
      )
    }

    if (conflictingSessions && conflictingSessions.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Time slot is not available' },
        { status: 400 }
      )
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        therapist_id: therapistId,
        start_time: sessionDateTime.toISOString(),
        end_time: sessionEndTime.toISOString(),
        duration: sessionDuration,
        session_type: sessionType,
        status: 'scheduled',
        notes: notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { success: false, error: 'Failed to book session' },
        { status: 500 }
      )
    }

    // Deduct credits from user
    const { error: creditError } = await supabase
      .from('individual_auth')
      .update({
        credits: user.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (creditError) {
      console.error('Error deducting credits:', creditError)
      // Don't fail the booking if credit deduction fails
    }

    // Send notifications (you can implement email notifications here)
    // await sendSessionConfirmationEmail(userId, therapistId, session)

    return NextResponse.json({
      success: true,
      session: session,
      message: 'Session booked successfully'
    })

  } catch (error) {
    console.error('Error in book session API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const therapistId = searchParams.get('therapistId')
    const status = searchParams.get('status')

    let query = supabase
      .from('sessions')
      .select(`
        *,
        users:user_id (id, full_name, email),
        therapists:therapist_id (id, full_name, email)
      `)
      .order('start_time', { ascending: true })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    })

  } catch (error) {
    console.error('Error in sessions GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
