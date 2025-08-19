import { NextRequest, NextResponse } from 'next/server'
import { processSessionInBackground } from '@/lib/session-ai-processor'
import { processSessionRecordingMock } from '@/lib/session-ai-processor-mock'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Daily.co webhook received:', body)

    const { event, data } = body

    // Handle recording finished event
    if (event === 'recording.finished') {
      const { id: recordingId, room_name, download_url, duration } = data

      console.log(`Recording finished: ${recordingId} for room: ${room_name}`)

      // Extract session ID from room name (assuming format like "trpi-session-{sessionId}")
      const sessionIdMatch = room_name.match(/session-([a-zA-Z0-9-]+)/)
      if (!sessionIdMatch) {
        console.error('Could not extract session ID from room name:', room_name)
        return NextResponse.json({ success: false, error: 'Invalid room name format' })
      }

      const sessionId = sessionIdMatch[1]

      // Update session with recording information
      await supabase
        .from('sessions')
        .update({
          daily_room_recording_id: recordingId,
          daily_room_recording_url: download_url,
          recording_duration: duration,
          recording_status: 'finished'
        })
        .eq('id', sessionId)

                   // Use mock processor for test recordings, real processor for actual recordings
             if (recordingId.startsWith('test-recording-')) {
               console.log('🎭 Using mock AI processor for test recording')
               console.log('🎭 Session ID:', sessionId, 'Recording ID:', recordingId)
               processSessionRecordingMock(sessionId, recordingId).catch(error => {
                 console.error('Background processing failed for session', sessionId, ':', error)
               })
             } else {
               console.log('🤖 Using real AI processor for actual recording')
               await processSessionInBackground(sessionId, recordingId)
             }

      return NextResponse.json({ 
        success: true, 
        message: 'Recording processed and AI analysis started',
        sessionId,
        recordingId
      })
    }

    // Handle recording started event
    if (event === 'recording.started') {
      const { id: recordingId, room_name } = data
      
      const sessionIdMatch = room_name.match(/session-([a-zA-Z0-9-]+)/)
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1]
        
        await supabase
          .from('sessions')
          .update({
            daily_room_recording_id: recordingId,
            recording_status: 'started'
          })
          .eq('id', sessionId)
      }

      return NextResponse.json({ success: true, message: 'Recording started' })
    }

    // Handle recording failed event
    if (event === 'recording.failed') {
      const { id: recordingId, room_name, error } = data
      
      const sessionIdMatch = room_name.match(/session-([a-zA-Z0-9-]+)/)
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1]
        
        await supabase
          .from('sessions')
          .update({
            recording_status: 'failed',
            recording_error: error
          })
          .eq('id', sessionId)

        // Store processing error
        await supabase
          .from('session_processing_errors')
          .insert({
            session_id: sessionId,
            recording_id: recordingId,
            error_message: `Recording failed: ${error}`
          })
      }

      return NextResponse.json({ success: true, message: 'Recording failure logged' })
    }

    console.log('Unhandled webhook event:', event)
    return NextResponse.json({ success: true, message: 'Event received but not processed' })

  } catch (error) {
    console.error('Error processing Daily.co webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
