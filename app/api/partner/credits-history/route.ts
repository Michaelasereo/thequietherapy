import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get partner ID from session (you'll need to implement session handling)
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'partner')
      .single()

    if (partnerError) {
      console.error('Error fetching partner:', partnerError)
      return NextResponse.json([])
    }

    // Get credit transactions for this partner
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        type,
        credits_in,
        credits_out,
        balance_after,
        created_at,
        member_name,
        description
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json([])
    }

    // Transform the data to match the expected interface
    const transformedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      date: transaction.created_at,
      type: transaction.type,
      member: transaction.member_name || null,
      creditsIn: transaction.credits_in || 0,
      creditsOut: transaction.credits_out || 0,
      balanceAfter: transaction.balance_after || 0
    })) || []

    return NextResponse.json(transformedTransactions)

  } catch (error) {
    console.error('Error in credits history:', error)
    return NextResponse.json([], { status: 500 })
  }
}
