import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { createDailyRoom } from "@/lib/daily"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const userCookie = cookieStore.get("trpi_user")?.value
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userData = JSON.parse(userCookie)
    const { therapistId, scheduledDate, scheduledTime, durationMinutes = 60, topic } = await request.json()

    if (!therapistId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get therapist info
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single()

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Create session title
    const sessionTitle = `${userData.name}'s Therapy Session with ${therapist.full_name}`
    
    // Create Daily.co room name (unique identifier)
    const roomName = `trpi-${userData.id}-${therapistId}-${Date.now()}`
    
    // Create Daily.co room
    let dailyRoomUrl = ''
    try {
      const dailyRoom = await createDailyRoom(roomName, {
        exp: Math.round(new Date(`${scheduledDate}T${scheduledTime}`).getTime() / 1000) + (durationMinutes * 60),
        enable_chat: true,
        enable_recording: false,
        start_video_off: false,
        start_audio_off: false
      })
      dailyRoomUrl = dailyRoom.url
    } catch (dailyError) {
      console.error('Daily.co room creation failed:', dailyError)
      // Continue without Daily.co room for now
    }

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userData.id,
        therapist_id: therapistId,
        title: sessionTitle,
        description: topic || 'Therapy session',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        status: 'scheduled',
        daily_room_name: roomName,
        daily_room_url: dailyRoomUrl,
        daily_room_created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        scheduledDate: session.scheduled_date,
        scheduledTime: session.scheduled_time,
        therapist: therapist.full_name,
        dailyRoomUrl: session.daily_room_url,
        roomName: session.daily_room_name
      }
    })

  } catch (error) {
    console.error('Book session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
