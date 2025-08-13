import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data
    // In production, this would fetch from database based on therapist ID
    const mockClients = [
      {
        id: "1",
        name: "John Smith",
        email: "john@example.com",
        phone: "+1234567890",
        age: 35,
        gender: "Male",
        primary_concern: "Anxiety",
        session_count: 5,
        last_session_date: "2024-01-15",
        next_session_date: "2024-01-22",
        status: "active",
        notes: "Responding well to treatment"
      },
      {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+1234567891",
        age: 28,
        gender: "Female",
        primary_concern: "Depression",
        session_count: 3,
        last_session_date: "2024-01-14",
        next_session_date: "2024-01-21",
        status: "active",
        notes: "Making good progress"
      }
    ]

    return NextResponse.json({
      success: true,
      clients: mockClients
    })

  } catch (error) {
    console.error('Get therapist clients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
