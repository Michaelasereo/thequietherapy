import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, recordingId } = await request.json()

    if (!sessionId || !recordingId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or recordingId' },
        { status: 400 }
      )
    }

    console.log(`Starting AI processing for session ${sessionId}, recording ${recordingId}`)

    // Dynamically import the AI processor to avoid build issues
    try {
      const { processSessionRecording } = await import('@/lib/session-ai-processor')
      
      // Process the session recording
      const result = await processSessionRecording(sessionId, recordingId)
      
      // Update the processing queue status
      await supabase
        .from('session_processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('recording_id', recordingId)

      return NextResponse.json({
        success: true,
        message: 'AI processing completed successfully',
        result
      })
    } catch (error) {
      console.error('Error in AI processing:', error)
      
      // Update the processing queue status to failed
      await supabase
        .from('session_processing_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('recording_id', recordingId)

      // Store error in processing errors table
      await supabase
        .from('session_processing_errors')
        .insert({
          session_id: sessionId,
          recording_id: recordingId,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })

      return NextResponse.json(
        { success: false, error: 'AI processing failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in process-ai route:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
