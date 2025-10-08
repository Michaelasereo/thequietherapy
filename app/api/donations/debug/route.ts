import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Fetch all donations with full details
    const { data: allDonations, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // Last 50 donations

    if (error) {
      throw error
    }

    // Calculate stats by status
    const statusBreakdown = {
      success: 0,
      pending: 0,
      failed: 0,
      cancelled: 0
    }

    let successTotal = 0
    let pendingTotal = 0
    const successEmails = new Set()

    allDonations?.forEach(d => {
      statusBreakdown[d.status as keyof typeof statusBreakdown] = 
        (statusBreakdown[d.status as keyof typeof statusBreakdown] || 0) + 1
      
      if (d.status === 'success') {
        successTotal += Number(d.amount) || 0
        if (d.email) successEmails.add(d.email)
      } else if (d.status === 'pending') {
        pendingTotal += Number(d.amount) || 0
      }
    })

    // Get recent webhook activity (if you have a webhook_logs table)
    // For now, we'll just return donation data

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalDonations: allDonations?.length || 0,
        statusBreakdown,
        successfulAmount: successTotal,
        pendingAmount: pendingTotal,
        uniqueSuccessfulDonors: successEmails.size,
        lastDonation: allDonations?.[0] || null
      },
      donations: allDonations?.map(d => ({
        id: d.id,
        amount: d.amount,
        donor_name: d.donor_name,
        email: d.email,
        status: d.status,
        reference: d.paystack_reference,
        created_at: d.created_at,
        verified_at: d.verified_at,
        timeSinceCreated: Date.now() - new Date(d.created_at).getTime(),
        hasWebhookResponse: !!d.gateway_response
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

