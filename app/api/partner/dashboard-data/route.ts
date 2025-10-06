import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    // Fetch partner info
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .eq('user_type', 'partner')
      .single()

    if (partnerError) {
      console.log('Partner not found, returning default data:', partnerError.message)
      return NextResponse.json({
        partner: null,
        summary: {
          totalCreditsPurchased: 0,
          creditsRemaining: 0,
          activeMembers: 0,
          totalSessionsBooked: 0
        },
        recentActivity: {
          latestMembers: [],
          latestPurchases: [],
          recentUsage: []
        }
      })
    }

    // Fetch partner members (users associated with this partner)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('is_active', true)

    if (membersError) throw membersError

    // Fetch sessions for partner members
    const memberIds = members?.map(m => m.id) || []
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .in('user_id', memberIds)

    if (sessionsError) throw sessionsError

    // Fetch credit transactions for this partner
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    // Calculate stats
    const totalCreditsPurchased = creditTransactions?.reduce((sum, t) => sum + (t.credits_in || 0), 0) || 0
    const totalCreditsUsed = creditTransactions?.reduce((sum, t) => sum + (t.credits_out || 0), 0) || 0
    const creditsRemaining = totalCreditsPurchased - totalCreditsUsed
    const activeMembers = members?.length || 0
    const totalSessionsBooked = sessions?.length || 0

    // Get recent activity
    const recentMembers = members?.slice(0, 5).map(m => ({
      id: m.id,
      name: m.full_name || m.email.split('@')[0],
      email: m.email
    })) || []

    const recentPurchases = creditTransactions?.slice(0, 5).map(t => ({
      id: t.id,
      date: t.created_at,
      credits: t.credits_in || 0,
      amount: t.amount || 0
    })) || []

    const recentUsage = sessions?.slice(0, 5).map(s => ({
      id: s.id,
      date: s.created_at,
      member: members?.find(m => m.id === s.user_id)?.full_name || 'Unknown Member',
      credits: 5 // Assuming 5 credits per session
    })) || []

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.full_name,
        email: partner.email,
        isVerified: partner.is_verified
      },
      summary: {
        totalCreditsPurchased,
        creditsRemaining,
        activeMembers,
        totalSessionsBooked
      },
      recentActivity: {
        latestMembers: recentMembers,
        latestPurchases: recentPurchases,
        recentUsage: recentUsage
      }
    })
  } catch (error) {
    console.error('Error fetching partner dashboard data:', error)
    return NextResponse.json({
      partner: null,
      summary: {
        totalCreditsPurchased: 0,
        creditsRemaining: 0,
        activeMembers: 0,
        totalSessionsBooked: 0
      },
      recentActivity: {
        latestMembers: [],
        latestPurchases: [],
        recentUsage: []
      }
    }, { status: 500 })
  }
}
