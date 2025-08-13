import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data
    // In production, this would fetch from database based on therapist ID
    const mockSessions = [
      {
        id: "1",
        client_id: "1",
        client_name: "John Smith",
        date: "2024-01-22",
        time: "10:00",
        duration: 60,
        type: "Individual",
        status: "scheduled",
        daily_room_url: "https://daily.co/room-1",
        notes: "Follow up on anxiety management techniques"
      },
      {
        id: "2",
        client_id: "2",
        client_name: "Sarah Johnson",
        date: "2024-01-21",
        time: "14:00",
        duration: 60,
        type: "Individual",
        status: "scheduled",
        daily_room_url: "https://daily.co/room-2",
        notes: "Continue depression treatment plan"
      }
    ]

    return NextResponse.json({
      success: true,
      sessions: mockSessions
    })

  } catch (error) {
    console.error('Get therapist sessions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
