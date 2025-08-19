import { NextRequest, NextResponse } from 'next/server'
import { stopRecording } from '@/lib/daily-recording'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordingId } = body

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      )
    }

    const recording = await stopRecording(recordingId)

    return NextResponse.json({
      success: true,
      recording,
      message: 'Recording stopped successfully'
    })

  } catch (error) {
    console.error('Error stopping recording:', error)
    return NextResponse.json(
      { error: 'Failed to stop recording' },
      { status: 500 }
    )
  }
}
