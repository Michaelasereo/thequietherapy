import { NextRequest, NextResponse } from 'next/server'
import { startRecording } from '@/lib/daily-recording'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomName, sessionId, layout = 'single', audioOnly = false } = body

    if (!roomName || !sessionId) {
      return NextResponse.json(
        { error: 'Room name and session ID are required' },
        { status: 400 }
      )
    }

    // Start recording with session-specific room name
    const recording = await startRecording({
      room_name: roomName,
      layout,
      audio_only: audioOnly,
      max_duration: 7200 // 2 hours
    })

    return NextResponse.json({
      success: true,
      recording,
      message: 'Recording started successfully'
    })

  } catch (error) {
    console.error('Error starting recording:', error)
    return NextResponse.json(
      { error: 'Failed to start recording' },
      { status: 500 }
    )
  }
}
