import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.DAILY_DOMAIN

export async function POST(request: NextRequest) {
  try {
    const { roomName, properties } = await request.json()

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      console.error('Missing Daily.co configuration')
      return NextResponse.json(
        { error: 'Video service configuration error' },
        { status: 500 }
      )
    }

    // Sanitize room name for Daily.co requirements
    const sanitizedRoomName = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    
    console.log('🏗️ Creating Daily.co room:', sanitizedRoomName)

    const response = await fetch(`https://api.daily.co/v1/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: sanitizedRoomName,
        privacy: 'private', // Must be 'public', 'private', or 'org'
        properties: {
          exp: Math.round(Date.now() / 1000) + (30 * 60), // 30 minutes for therapy session
          eject_at_room_exp: true,
          enable_chat: true,
          enable_recording: false, // Disabled for Nigerian compliance
          enable_transcription: false, // Use OpenAI Whisper instead
          enable_prejoin_ui: true,
          enable_network_ui: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 2, // Only therapist and patient
          ...properties
        }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Daily.co API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create video room'
      if (response.status === 401) {
        errorMessage = 'Invalid Daily.co API key'
      } else if (response.status === 403) {
        errorMessage = 'Daily.co API key lacks room creation permissions'
      } else if (response.status === 409) {
        errorMessage = `Room name "${sanitizedRoomName}" already exists`
      } else if (data.error) {
        errorMessage = `Daily.co error: ${data.error}${data.info ? ` - ${data.info}` : ''}`
      }
      
      return NextResponse.json(
        { error: errorMessage, details: data },
        { status: response.status }
      )
    }

    console.log('✅ Room created successfully:', roomName)
    return NextResponse.json({
      room: {
        name: data.name,
        url: data.url,
        id: data.id,
        created_at: data.created_at
      }
    })

  } catch (error) {
    console.error('❌ Create room error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
