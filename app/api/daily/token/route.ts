import { NextRequest, NextResponse } from "next/server"
import { generateMeetingToken } from "@/lib/daily"

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, isOwner } = await request.json()

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      )
    }

    const token = await generateMeetingToken(roomName, participantName, isOwner || false)

    return NextResponse.json({
      success: true,
      token
    })

  } catch (error) {
    console.error('Generate token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
