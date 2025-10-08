import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Get total count of donations
    const { count: totalCount, error: countError } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get successful donations count
    const { count: successCount, error: successError } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')

    if (successError) throw successError

    // Get sample donations data
    const { data: sampleDonations, error: sampleError } = await supabase
      .from('donations')
      .select('id, amount, status, created_at, donor_name, email')
      .order('created_at', { ascending: false })
      .limit(10)

    if (sampleError) throw sampleError

    // Calculate total amount raised
    const { data: allDonations, error: amountError } = await supabase
      .from('donations')
      .select('amount, status')
      .eq('status', 'success')

    if (amountError) throw amountError

    const totalRaised = allDonations?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        totalDonations: totalCount || 0,
        successfulDonations: successCount || 0,
        totalRaised: totalRaised,
        sampleDonations: sampleDonations || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error counting donations:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      data: {
        totalDonations: 0,
        successfulDonations: 0,
        totalRaised: 0,
        sampleDonations: []
      }
    }, { status: 500 })
  }
}
