import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Daily.co webhook received (recording disabled for compliance):', body);

    // Since Daily.co recording is disabled, this webhook is for reference only
    // All actual recording is handled by browser MediaRecorder
    
    const { event, data } = body;

    if (event === 'recording.finished') {
      console.log('Daily.co recording finished event (disabled for compliance)');
      console.log('Note: All recording is handled by browser MediaRecorder');
      
      return NextResponse.json({
        success: true,
        message: 'Daily.co webhook received (recording disabled for compliance)',
        note: 'Browser MediaRecorder handles all recording - no raw audio stored on external servers',
        compliance: {
          raw_audio_storage: 'disabled',
          processing_location: 'browser_local',
          data_storage: 'transcripts_only',
          third_party_audio: 'none'
        }
      });
    }

    // Handle other events
    return NextResponse.json({
      success: true,
      message: 'Daily.co webhook processed (recording disabled for compliance)',
      event,
      note: 'Browser MediaRecorder handles all recording'
    });

  } catch (error) {
    console.error('Daily.co webhook error (recording disabled):', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook processing error (recording disabled for compliance)',
        note: 'Browser MediaRecorder handles all recording'
      },
      { status: 200 } // Return 200 since this is expected behavior
    );
  }
}
