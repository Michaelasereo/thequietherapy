import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Cache for 30 seconds to reduce database load
const CACHE_DURATION = 30 * 1000 // 30 seconds
let cache: { data: any; timestamp: number } | null = null

export async function GET(request: NextRequest) {
  try {
    // Check for cache-busting header
    const cacheControl = request.headers.get('cache-control')
    const shouldBustCache = cacheControl === 'no-cache'

    // Check cache first (unless cache-busting is requested)
    if (!shouldBustCache && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log('📊 Donation stats: Returning cached data')
      return NextResponse.json({
        success: true,
        data: cache.data,
        cached: true,
        timestamp: cache.timestamp
      })
    }

    if (shouldBustCache) {
      console.log('📊 Donation stats: Cache busted, fetching fresh data')
    }

    const supabase = createServerClient()
    
    // Get successful donations from the last 45 days (campaign period)
    const campaignStartDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, email, created_at, donor_name')
      .eq('status', 'success')
      .eq('donation_type', 'seed_funding')
      .gte('created_at', campaignStartDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching donation stats:', error)
      
      // If table doesn't exist or other database error, return zero stats
      if (error.code === 'PGRST116' || error.message?.includes('relation "donations" does not exist')) {
        console.log('📊 Donations table does not exist yet, returning zero stats')
        const zeroStats = {
          raised: 0,
          donors: 0,
          target: 120000000,
          daysLeft: 45,
          averageDonation: 0,
          progressPercentage: 0,
          recentDonations: []
        }
        
        return NextResponse.json({
          success: true,
          data: zeroStats,
          cached: false,
          timestamp: Date.now()
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch donation statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalRaised = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
    const donorCount = new Set(donations?.map(d => d.email)).size
    const averageDonation = donorCount > 0 ? totalRaised / donorCount : 0
    
    // Calculate days left (assuming 45-day campaign from start date)
    const campaignStart = new Date('2024-01-01').getTime() // Adjust to your campaign start date
    const daysLeft = Math.max(0, 45 - Math.floor((Date.now() - campaignStart) / (1000 * 60 * 60 * 24)))
    
    // Get recent donations for activity feed
    const recentDonations = donations?.slice(0, 10).map(donation => ({
      amount: donation.amount,
      donor_name: donation.donor_name,
      created_at: donation.created_at,
      // Mask email for privacy: john@example.com -> j***@example.com
      email_masked: donation.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })) || []

    const stats = {
      raised: totalRaised,
      donors: donorCount,
      target: 120000000,
      daysLeft,
      averageDonation: Math.round(averageDonation),
      progressPercentage: Math.min(100, (totalRaised / 120000000) * 100),
      recentDonations
    }

    // Update cache
    cache = {
      data: stats,
      timestamp: Date.now()
    }

    console.log('📊 Donation stats calculated:', {
      raised: totalRaised,
      donors: donorCount,
      progress: `${stats.progressPercentage.toFixed(1)}%`
    })

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('❌ Donation stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to invalidate cache (called by webhook)
export async function invalidateCache() {
  cache = null
  console.log('🗑️ Donation stats cache invalidated')
}
