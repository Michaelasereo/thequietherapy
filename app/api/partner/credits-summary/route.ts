import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get partner ID from session (you'll need to implement session handling)
    // For now, we'll get the first partner as an example
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('id, partner_credits')
      .eq('user_type', 'partner')
      .single()

    if (partnerError) {
      console.error('Error fetching partner:', partnerError)
      return NextResponse.json({ 
        creditsRemaining: 0,
        totalCreditsPurchased: 0,
        totalCreditsUsed: 0
      })
    }

    // Get credit transactions for this partner
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ 
        creditsRemaining: partner.partner_credits || 0,
        totalCreditsPurchased: partner.partner_credits || 0,
        totalCreditsUsed: 0
      })
    }

    const totalCreditsPurchased = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.credits_in || 0), 0)

    const totalCreditsUsed = transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + (t.credits_out || 0), 0)

    const creditsRemaining = (partner.partner_credits || 0) - totalCreditsUsed

    return NextResponse.json({
      creditsRemaining: Math.max(0, creditsRemaining),
      totalCreditsPurchased,
      totalCreditsUsed
    })

  } catch (error) {
    console.error('Error in credits summary:', error)
    return NextResponse.json({ 
      creditsRemaining: 0,
      totalCreditsPurchased: 0,
      totalCreditsUsed: 0
    }, { status: 500 })
  }
}
