import { NextRequest, NextResponse } from "next/server"
import { createDailyRoom } from "@/lib/daily"

export async function POST(request: NextRequest) {
  try {
    const { roomName, properties } = await request.json()

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    const room = await createDailyRoom(roomName, properties)

    return NextResponse.json({
      success: true,
      room
    })

  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
