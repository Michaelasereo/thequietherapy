import { NextRequest, NextResponse } from 'next/server'
import { rescheduleSession } from '@/lib/session-management-server'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId, newDate, newTime, reason, requestedBy } = await req.json()

    // Validate required fields
    if (!sessionId || !newDate || !newTime || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(newDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(newTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format' },
        { status: 400 }
      )
    }

    // Reschedule the session
    const result = await rescheduleSession(
      sessionId,
      newDate,
      newTime,
      reason
    )

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error rescheduling session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
