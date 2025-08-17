import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) throw error

    const monthlyRevenue = 0 // Sessions don't have amount field
    const previousMonthRevenue = 0 // Estimate
    const growthRate = 0

    // Calculate revenue by source
    const individualSessions = 0
    const partnerSessions = 0
    const otherRevenue = 0

    return NextResponse.json({
      monthlyRevenue,
      previousMonthRevenue,
      growthRate: Math.round(growthRate * 10) / 10,
      topRevenueSources: [
        { source: "Individual Sessions", amount: individualSessions, percentage: monthlyRevenue > 0 ? (individualSessions / monthlyRevenue) * 100 : 0 },
        { source: "Partner Subscriptions", amount: partnerSessions, percentage: monthlyRevenue > 0 ? (partnerSessions / monthlyRevenue) * 100 : 0 },
        { source: "Other", amount: otherRevenue, percentage: monthlyRevenue > 0 ? (otherRevenue / monthlyRevenue) * 100 : 0 }
      ]
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json({
      monthlyRevenue: 0,
      previousMonthRevenue: 0,
      growthRate: 0,
      topRevenueSources: []
    }, { status: 500 })
  }
}
