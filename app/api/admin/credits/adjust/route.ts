import { NextRequest, NextResponse } from 'next/server'
import { adjustUserCredits } from '@/lib/credits-payments'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession()
    if (!session || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { userId, amount, reason } = await req.json()

    // Validate required fields
    if (!userId || amount === undefined || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Amount must be a number' },
        { status: 400 }
      )
    }

    // Adjust user credits
    const result = await adjustUserCredits(userId, amount, reason, session.userId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error adjusting user credits:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
