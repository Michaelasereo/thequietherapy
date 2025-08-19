import { NextRequest, NextResponse } from 'next/server'
import { processSessionRecording, getProcessingStatus, retryProcessing } from '@/lib/session-ai-processor'
import { processSessionRecordingMock } from '@/lib/session-ai-processor-mock'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const status = await getProcessingStatus(id)

    return NextResponse.json({
      success: true,
      sessionId: id,
      ...status
    })
  } catch (error) {
    console.error('Error getting processing status:', error)
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, recordingId } = body
    
    console.log('🔍 AI Process Request:', { id, action, recordingId, body })

    if (action === 'start') {
      // Manual start of AI processing
      if (!recordingId) {
        // Try to get recording ID from session
        const { data: session } = await supabase
          .from('sessions')
          .select('daily_room_recording_id')
          .eq('id', id)
          .single()

        if (!session?.daily_room_recording_id) {
          return NextResponse.json(
            { error: 'No recording ID found for this session' },
            { status: 400 }
          )
        }

        const sessionRecordingId = session.daily_room_recording_id
        
        // Use mock processor for test recordings
        if (sessionRecordingId.startsWith('test-recording-')) {
          console.log('🎭 Using mock AI processor for test recording')
          await processSessionRecordingMock(id, sessionRecordingId)
        } else {
          console.log('🤖 Using real AI processor for actual recording')
          await processSessionRecording(id, sessionRecordingId)
        }
              } else {
          // Use mock processor for test recordings
          if (recordingId.startsWith('test-recording-')) {
            console.log('🎭 Using mock AI processor for test recording')
            await processSessionRecordingMock(id, recordingId)
          } else {
            console.log('🤖 Using real AI processor for actual recording')
            await processSessionRecording(id, recordingId)
          }
        }

      return NextResponse.json({
        success: true,
        message: 'AI processing started',
        sessionId: id
      })
    }

    if (action === 'retry') {
      if (!recordingId) {
        const { data: session } = await supabase
          .from('sessions')
          .select('daily_room_recording_id')
          .eq('id', id)
          .single()

        if (!session?.daily_room_recording_id) {
          return NextResponse.json(
            { error: 'No recording ID found for this session' },
            { status: 400 }
          )
        }

        await retryProcessing(id, session.daily_room_recording_id)
      } else {
        await retryProcessing(id, recordingId)
      }

      return NextResponse.json({
        success: true,
        message: 'AI processing retry started',
        sessionId: id
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "retry"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing AI request:', error)
    console.error('Error details:', {
      message: (error as any).message,
      stack: (error as any).stack,
      name: (error as any).name
    })
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}
