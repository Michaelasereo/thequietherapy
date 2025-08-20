import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get pending sessions from the queue
    const { data: pendingSessions, error: queueError } = await supabase
      .from('session_processing_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5) // Process 5 at a time

    if (queueError) {
      console.error('Error fetching pending sessions:', queueError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending sessions' },
        { status: 500 }
      )
    }

    if (!pendingSessions || pendingSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending sessions to process',
        processed: 0
      })
    }

    console.log(`Processing ${pendingSessions.length} pending sessions`)

    const results = []

    for (const session of pendingSessions) {
      try {
        // Update status to processing
        await supabase
          .from('session_processing_queue')
          .update({ status: 'processing' })
          .eq('session_id', session.session_id)
          .eq('recording_id', session.recording_id)

        // Call the AI processing endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sessions/process-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.session_id,
            recordingId: session.recording_id
          })
        })

        if (response.ok) {
          results.push({
            sessionId: session.session_id,
            status: 'success'
          })
        } else {
          const errorData = await response.json()
          results.push({
            sessionId: session.session_id,
            status: 'error',
            error: errorData.error
          })
        }
      } catch (error) {
        console.error(`Error processing session ${session.session_id}:`, error)
        results.push({
          sessionId: session.session_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingSessions.length} sessions`,
      results
    })

  } catch (error) {
    console.error('Error in process-queue route:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
