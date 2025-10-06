// Daily.co integration for therapy sessions
const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    max_participants: number;
    nbf?: number; // not before (start time)
    exp?: number; // expiration time
    enable_recording?: boolean;
    enable_transcription?: boolean;
  };
}

export interface CreateRoomOptions {
  sessionId: string;
  therapistName: string;
  patientName: string;
  duration: number; // in minutes
  scheduledTime: Date;
}

export async function createTherapySessionRoom(options: CreateRoomOptions): Promise<DailyRoom> {
  if (!DAILY_API_KEY) {
    console.error('❌ Daily.co API key not configured');
    throw new Error('DAILY_API_KEY is not configured');
  }
  
  console.log('🔍 Daily.co API key configured, creating room...');

  const { sessionId, therapistName, patientName, duration, scheduledTime } = options;
  
  // Create a unique room name
  const roomName = `therapy-session-${sessionId}-${Date.now()}`;
  
  // ONLY 30 MINUTES for Daily.co (therapy session only)
  // The buffer period is handled by your app, not Daily.co
  const THERAPY_DURATION_MINUTES = 30; // Therapy session is 30 minutes
  const expirationTime = new Date(scheduledTime.getTime() + THERAPY_DURATION_MINUTES * 60 * 1000);
  
  // Try different configurations in order of preference
  const configs = [
    // Configuration with meeting tokens (preferred)
    {
      name: roomName,
      privacy: 'private',
      properties: {
        max_participants: 2,
        enable_knocking: false,
        enable_screenshare: true,
        enable_chat: true,
        exp: Math.floor(expirationTime.getTime() / 1000) // Set room expiration
      }
    },
    // Minimal configuration
    {
      name: roomName,
      privacy: 'private',
      properties: {
        max_participants: 2,
        exp: Math.floor(expirationTime.getTime() / 1000) // Set room expiration
      }
    },
    // Even more minimal
    {
      name: roomName,
      privacy: 'private',
      properties: {
        exp: Math.floor(expirationTime.getTime() / 1000) // Set room expiration
      }
    },
    // Absolute minimal
    {
      name: roomName,
      properties: {
        exp: Math.floor(expirationTime.getTime() / 1000) // Set room expiration
      }
    }
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < configs.length; i++) {
    const roomConfig = configs[i];
    
    try {
      console.log(`🔍 Creating Daily.co room (attempt ${i + 1}):`, roomConfig);

      const response = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomConfig),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Daily.co API error (attempt ${i + 1}):`, response.status, errorText);
        
        // Try to parse the error for more specific handling
        let errorMessage = `Daily.co API error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.info) {
            errorMessage += ` - ${errorData.info}`;
          }
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        
        lastError = new Error(errorMessage);
        continue; // Try next configuration
      }

      const roomData = await response.json();
      
      console.log(`✅ Daily.co room created successfully (attempt ${i + 1}):`, roomData);
      console.log('🎥 Daily.co room created with 30-minute duration for therapy session');

      return {
        id: roomData.id,
        name: roomData.name,
        url: roomData.url,
        created_at: roomData.created_at,
        config: roomData.config
      };

    } catch (error) {
      console.error(`❌ Failed to create Daily.co room (attempt ${i + 1}):`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue; // Try next configuration
    }
  }

  // If we get here, all configurations failed
  console.error('❌ All Daily.co room creation attempts failed');
  throw new Error(`Failed to create video room after ${configs.length} attempts: ${lastError?.message || 'Unknown error'}`);
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to delete Daily.co room:', response.status);
    } else {
      console.log('✅ Daily.co room deleted successfully');
    }
  } catch (error) {
    console.error('❌ Error deleting Daily.co room:', error);
  }
}

export async function getRoomInfo(roomName: string): Promise<DailyRoom | null> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Daily.co API error: ${response.status}`);
    }

    const roomData = await response.json();
    return roomData;
  } catch (error) {
    console.error('❌ Error fetching room info:', error);
    return null;
  }
}

// Helper function to generate meeting tokens (for enhanced security)
export async function createMeetingToken(roomName: string, userName: string, isOwner: boolean = false): Promise<string> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const tokenConfig = {
    properties: {
      room_name: roomName,
      user_name: userName,
      is_owner: isOwner,
      exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours
    }
  };

  try {
    console.log('🔍 Creating meeting token with config:', tokenConfig);
    
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Daily.co token API error:', response.status, errorText);
      throw new Error(`Daily.co token API error: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Meeting token created successfully:', tokenData.token ? 'Token received' : 'No token in response');
    return tokenData.token;
  } catch (error) {
    console.error('❌ Failed to create meeting token:', error);
    throw new Error(`Failed to create meeting token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export aliases for the missing functions
export const generateMeetingToken = createMeetingToken;

export async function startSessionRecording(roomName: string): Promise<{ success: boolean; error?: string; recordingId?: string }> {
  if (!DAILY_API_KEY) {
    return { success: false, error: 'DAILY_API_KEY is not configured' };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_name: roomName,
        start_recording: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Daily.co recording API error:', response.status, errorText);
      return { success: false, error: `Daily.co recording API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('✅ Session recording started successfully');
    return { success: true, recordingId: data.id };
  } catch (error) {
    console.error('❌ Failed to start session recording:', error);
    return { success: false, error: `Failed to start session recording: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function stopSessionRecording(roomName: string): Promise<{ success: boolean; error?: string; recordingUrl?: string }> {
  if (!DAILY_API_KEY) {
    return { success: false, error: 'DAILY_API_KEY is not configured' };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_name: roomName,
        stop_recording: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Daily.co recording API error:', response.status, errorText);
      return { success: false, error: `Daily.co recording API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('✅ Session recording stopped successfully');
    return { success: true, recordingUrl: data.url };
  } catch (error) {
    console.error('❌ Failed to stop session recording:', error);
    return { success: false, error: `Failed to stop session recording: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}