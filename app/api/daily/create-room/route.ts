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

    const response = await fetch(`https://api.daily.co/v1/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 1, // Private room
        properties: {
          exp: Math.round(Date.now() / 1000) + (60 * 60 * 2), // 2 hours
          eject_at_room_exp: true,
          enable_chat: true,
          enable_recording: false, // Disabled for Nigerian compliance
          start_video_off: false,
          start_audio_off: false,
          ...properties
        }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Daily.co API error:', data)
      return NextResponse.json(
        { error: 'Failed to create video room' },
        { status: 500 }
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
