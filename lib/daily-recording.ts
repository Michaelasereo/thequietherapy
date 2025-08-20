import { DailyCall } from '@daily-co/react-native-daily-js';

// DISABLED: Daily.co raw recording for compliance
// We use browser-based MediaRecorder instead to avoid storing raw audio on third-party servers

export interface RecordingConfig {
  layout: 'single' | 'grid';
  audioOnly: boolean;
  // Note: Daily.co recording is disabled for compliance
  // All recording is done via browser MediaRecorder
}

export async function startDailyRecording(
  callObject: DailyCall,
  config: RecordingConfig
): Promise<{ success: boolean; message: string; recording?: any; note?: string }> {
  try {
    console.log('Daily.co recording is DISABLED for compliance');
    console.log('Using browser-based MediaRecorder instead');
    
    return {
      success: true,
      message: 'Daily.co recording disabled for compliance. Use browser MediaRecorder for audio recording.',
      note: 'Raw audio is not stored on Daily.co servers - only processed locally'
    };
  } catch (error) {
    console.error('Daily.co recording error (disabled):', error);
    return {
      success: false,
      message: 'Daily.co recording is disabled for compliance reasons'
    };
  }
}

export async function stopDailyRecording(
  recordingId: string
): Promise<{ success: boolean; message: string; recording?: any; note?: string }> {
  try {
    console.log('Daily.co recording stop requested (disabled for compliance)');
    
    return {
      success: true,
      message: 'Daily.co recording is disabled. Browser MediaRecorder handles all recording.',
      note: 'No raw audio stored on external servers'
    };
  } catch (error) {
    console.error('Daily.co recording stop error (disabled):', error);
    return {
      success: false,
      message: 'Daily.co recording is disabled for compliance reasons'
    };
  }
}

export async function getRecording(recordingId: string): Promise<any> {
  // DISABLED for compliance - return mock data
  console.log('Daily.co getRecording is disabled for compliance');
  return {
    status: 'disabled',
    message: 'Recording retrieval disabled for compliance - use browser MediaRecorder instead'
  };
}

export async function processRecording(recording: any, outputDir: string): Promise<{ audioPath: string }> {
  // DISABLED for compliance - return mock data
  console.log('Daily.co processRecording is disabled for compliance');
  return {
    audioPath: '/tmp/mock-audio.wav'
  };
}

// Compliance note: This ensures no raw audio is stored on Daily.co servers
// All audio processing happens locally in the browser via MediaRecorder
// Only transcripts are stored in our database
