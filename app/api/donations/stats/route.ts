import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Attempt live data first
    const supabase = createServerClient()
    
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, email, created_at, donor_name, status')
      .eq('status', 'success')
      .gte('created_at', new Date('2024-01-01').toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    // Your existing calculations (proven working)
    const totalRaised = donations?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0
    const donorCount = new Set((donations || [])
      .map(d => d.email)
      .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)
    ).size

    const stats = {
      raised: totalRaised,
      donors: donorCount,
      target: 120000000,
      daysLeft: Math.max(0, 45 - Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))),
      averageDonation: donorCount > 0 ? Math.round(totalRaised / donorCount) : 0,
      recentDonations: (donations || []).slice(0, 10).map(d => ({
        amount: d.amount,
        donor_name: d.donor_name,
        created_at: d.created_at,
        email_masked: typeof d.email === 'string' ? d.email.replace(/(.{2}).*(@.*)/, '$1***$2') : ''
      }))
    }

    console.log(`✅ Live stats fetched: ₦${totalRaised} from ${donorCount} donors`)

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false,
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      source: 'live_database'
    })

  } catch (error) {
    console.error('❌ Live stats failed, using fallback:', error.message)
    
    // Graceful fallback - users never see 500 errors
    const fallbackData = {
      raised: 0,
      donors: 0,
      target: 120000000,
      daysLeft: 45,
      averageDonation: 0,
      recentDonations: []
    }

    return NextResponse.json({
      success: true,
      data: fallbackData,
      cached: false,
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      source: 'fallback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
