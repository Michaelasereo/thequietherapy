import { NextRequest, NextResponse } from 'next/server'
import { stopSessionRecording } from '@/lib/daily'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Authentication check - only therapists can stop recordings
    const authResult = await requireApiAuth(['therapist'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { recordingId } = await request.json()
    validateRequired({ recordingId }, ['recordingId'])

    console.log('🛑 Stopping recording:', recordingId)

    const result = await stopSessionRecording(recordingId)

    if (!result.success) {
      throw new Error(result.error || 'Failed to stop recording')
    }

    return successResponse({
      recordingUrl: result.recordingUrl,
      message: 'Recording stopped successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}