import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Check all donations regardless of status
    const { data: allDonations, error: allError } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) throw allError

    // Check for different status types
    const statusCounts: any = {
      success: 0,
      pending: 0,
      failed: 0,
      completed: 0,
      total: allDonations?.length || 0
    }

    allDonations?.forEach(donation => {
      const status = donation.status?.toLowerCase() || 'unknown'
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++
      }
    })

    // Calculate totals
    const totalRaised = allDonations?.reduce((sum, d) => {
      const status = d.status?.toLowerCase()
      if (status === 'success' || status === 'completed') {
        return sum + (Number(d.amount) || 0)
      }
      return sum
    }, 0) || 0

    // Get unique donors
    const uniqueDonors = new Set(allDonations?.map(d => d.email).filter(Boolean))

    return NextResponse.json({
      success: true,
      data: {
        totalDonations: allDonations?.length || 0,
        statusBreakdown: statusCounts,
        totalRaised,
        uniqueDonors: uniqueDonors.size,
        allDonations: allDonations || [],
        databaseInfo: {
          tableExists: true,
          querySuccessful: true
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error analyzing donations:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      data: {
        totalDonations: 0,
        statusBreakdown: { success: 0, pending: 0, failed: 0, completed: 0, total: 0 },
        totalRaised: 0,
        uniqueDonors: 0,
        allDonations: [],
        databaseInfo: {
          tableExists: false,
          querySuccessful: false,
          error: error.message
        }
      }
    }, { status: 500 })
  }
}
