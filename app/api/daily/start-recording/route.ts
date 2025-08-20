import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, sessionId, layout, audioOnly } = body;

    console.log('Daily.co recording is DISABLED for compliance');
    console.log('Using browser-based MediaRecorder instead');

    // Return success with compliance note
    return NextResponse.json({
      success: true,
      message: 'Daily.co recording disabled for compliance',
      note: 'Raw audio is not stored on Daily.co servers - only processed locally via browser MediaRecorder',
      compliance: {
        raw_audio_storage: 'disabled',
        processing_location: 'browser_local',
        data_storage: 'transcripts_only',
        third_party_audio: 'none'
      },
      recording: {
        id: 'browser-media-recorder',
        status: 'local_only',
        method: 'MediaRecorder API',
        storage: 'transcripts only'
      }
    });

  } catch (error) {
    console.error('Daily.co recording error (disabled):', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Daily.co recording is disabled for compliance reasons',
        note: 'Use browser MediaRecorder for audio recording'
      },
      { status: 200 } // Return 200 since this is expected behavior
    );
  }
}
