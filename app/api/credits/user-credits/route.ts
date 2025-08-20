import { NextRequest, NextResponse } from 'next/server'
import { getUserCredits, getCreditTransactions } from '@/lib/credits-payments'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const includeTransactions = searchParams.get('includeTransactions') === 'true'

    // Get user credits
    const userCredits = await getUserCredits(session.userId)
    if (!userCredits) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user credits' },
        { status: 500 }
      )
    }

    const response: any = {
      success: true,
      credits: userCredits
    }

    // Include transactions if requested
    if (includeTransactions) {
      const transactions = await getCreditTransactions(session.userId)
      response.transactions = transactions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
