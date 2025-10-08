import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
  }

  try {
    // Dynamic import to avoid build-time issues
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()

    if (!supabase) {
      throw new Error('Supabase client creation failed')
    }

    // Fetch ONLY successful donations (verified payments)
    const { data: donations, error, count } = await supabase
      .from('donations')
      .select('amount, email, donor_name, status, created_at', { count: 'exact' })
      .eq('status', 'success')

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    // Calculate stats from successful donations only
    const totalRaised = donations?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0
    const donorCount = new Set(donations?.map(d => d.email).filter(Boolean)).size

    const response = {
      success: true,
      data: {
        raised: totalRaised,
        donors: donorCount,
        target: 120000000,
        daysLeft: 45,
        averageDonation: donorCount > 0 ? Math.round(totalRaised / donorCount) : 0,
        totalRecords: count || 0,
        recentDonations: (donations || []).slice(0, 5).map(d => ({
          amount: d.amount,
          donor_name: d.donor_name,
          created_at: d.created_at,
          email_masked: d.email ? d.email.replace(/(.{2}).*(@.*)/, '$1***$2') : ''
        }))
      },
      diagnostics: {
        ...diagnostics,
        responseTime: Date.now() - startTime,
        source: 'live_database',
        recordCount: count,
        supabaseConnected: true
      },
      timestamp: Date.now()
    }

    console.log('✅ Production API Success:', response.data)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Production API Fallback:', error.message)
    
    const fallbackResponse = {
      success: true,
      data: {
        raised: 0,
        donors: 0,
        target: 120000000,
        daysLeft: 45,
        averageDonation: 0,
        totalRecords: 0,
        recentDonations: []
      },
      diagnostics: {
        ...diagnostics,
        responseTime: Date.now() - startTime,
        source: 'fallback',
        error: error.message,
        supabaseConnected: false
      },
      timestamp: Date.now()
    }

    return NextResponse.json(fallbackResponse)
  }
}
