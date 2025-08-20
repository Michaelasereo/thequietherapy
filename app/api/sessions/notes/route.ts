import { NextRequest, NextResponse } from 'next/server'
import { addSessionNote, getSessionNotes } from '@/lib/session-management'
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

    const { sessionId, note, createdBy } = await req.json()

    // Validate required fields
    if (!sessionId || !note) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add the note
    const result = await addSessionNote(
      sessionId,
      note,
      createdBy || session.userType
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
    console.error('Error adding session note:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get session notes
    const notes = await getSessionNotes(sessionId)

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Error fetching session notes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
