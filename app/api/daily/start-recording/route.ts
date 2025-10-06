import { NextRequest, NextResponse } from 'next/server'
import { startSessionRecording } from '@/lib/daily'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Authentication check - only therapists can start recordings
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { roomName } = await request.json()
    validateRequired({ roomName }, ['roomName'])

    console.log('🎥 Starting recording for room:', roomName)

    const result = await startSessionRecording(roomName)

    if (!result.success) {
      throw new Error(result.error || 'Failed to start recording')
    }

    return successResponse({
      recordingId: result.recordingId,
      message: 'Recording started successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}