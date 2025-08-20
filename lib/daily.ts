// Daily.co configuration and utilities
export const DAILY_CONFIG = {
  // You'll need to get these from your Daily.co dashboard
  DAILY_API_KEY: process.env.DAILY_API_KEY || '',
  DAILY_URL: 'https://api.daily.co/v1',
  DAILY_DOMAIN: process.env.DAILY_DOMAIN || 'thequietherapy.daily.co'
}

export interface DailyRoom {
  id: string
  name: string
  url: string
  privacy: 'public' | 'private'
  properties?: {
    exp?: number
    eject_at_room_exp?: boolean
    enable_chat?: boolean
    enable_recording?: boolean
    start_video_off?: boolean
    start_audio_off?: boolean
  }
}

export interface DailyParticipant {
  id: string
  name: string
  owner: boolean
  permissions: string[]
}

// Create a new room
export async function createDailyRoom(roomName: string, properties?: any): Promise<DailyRoom> {
  if (!DAILY_CONFIG.DAILY_API_KEY) {
    throw new Error('Daily.co API key not configured')
  }

  const response = await fetch(`${DAILY_CONFIG.DAILY_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp: Math.round(Date.now() / 1000) + (60 * 60 * 2), // 2 hours from now
        eject_at_room_exp: true,
        enable_chat: true,
        enable_recording: false, // Disable recording for privacy
        start_video_off: false,
        start_audio_off: false,
        ...properties
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create Daily.co room: ${response.statusText}`)
  }

  return response.json()
}

// Get room information
export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  if (!DAILY_CONFIG.DAILY_API_KEY) {
    throw new Error('Daily.co API key not configured')
  }

  const response = await fetch(`${DAILY_CONFIG.DAILY_URL}/rooms/${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get Daily.co room: ${response.statusText}`)
  }

  return response.json()
}

// Delete a room
export async function deleteDailyRoom(roomName: string): Promise<void> {
  if (!DAILY_CONFIG.DAILY_API_KEY) {
    throw new Error('Daily.co API key not configured')
  }

  const response = await fetch(`${DAILY_CONFIG.DAILY_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to delete Daily.co room: ${response.statusText}`)
  }
}

// Generate a meeting token for a participant
export async function generateMeetingToken(roomName: string, participantName: string, isOwner: boolean = false): Promise<string> {
  if (!DAILY_CONFIG.DAILY_API_KEY) {
    throw new Error('Daily.co API key not configured')
  }

  const response = await fetch(`${DAILY_CONFIG.DAILY_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: participantName,
        is_owner: isOwner
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate meeting token: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.token || data
}
