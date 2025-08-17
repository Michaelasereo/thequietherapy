import { NextRequest, NextResponse } from 'next/server'
import { bookSession, checkTherapistAvailability, getAvailableSlots } from '@/lib/session-management'

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

    // Create session data
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`)
    const sessionEndTime = new Date(sessionDateTime.getTime() + sessionDuration * 60000)

    const sessionData = {
      user_id: userId,
      therapist_id: therapistId,
      start_time: sessionDateTime.toISOString(),
      end_time: sessionEndTime.toISOString(),
      duration: sessionDuration,
      session_type: sessionType,
      notes: notes
    }

    // Book the session using simplified logic
    const result = await bookSession(sessionData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        session: result.session,
        message: 'Session booked successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to book session' },
        { status: 400 }
      )
    }

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
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')

    // If requesting available slots
    if (therapistId && date) {
      const availableSlots = await getAvailableSlots(
        therapistId,
        new Date(date),
        duration
      )
      
      return NextResponse.json({
        success: true,
        availableSlots
      })
    }

    // If requesting sessions
    const sessions = await getSessions(userId || undefined, therapistId || undefined, status || undefined)

    return NextResponse.json({
      success: true,
      sessions
    })

  } catch (error) {
    console.error('Error in sessions GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get sessions (imported from session-management)
async function getSessions(userId?: string, therapistId?: string, status?: string) {
  const { getSessions } = await import('@/lib/session-management')
  return getSessions(userId, therapistId, status)
}
