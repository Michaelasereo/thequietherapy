import { NextRequest, NextResponse } from 'next/server'
import { cancelSession } from '@/lib/session-management-server'
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

    const { sessionId, reason, cancelledBy } = await req.json()

    // Validate required fields
    if (!sessionId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Cancel the session
    const result = await cancelSession(
      sessionId,
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
    console.error('Error cancelling session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
