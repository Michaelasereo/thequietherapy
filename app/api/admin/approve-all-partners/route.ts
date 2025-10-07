import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🚀 Starting bulk partner approval process...')

    // 1. Get all partners and their current status
    const { data: partners, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, partner_status, is_verified, is_active, created_at')
      .eq('user_type', 'partner')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching partners:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch partners',
        details: fetchError.message 
      }, { status: 500 })
    }

    console.log(`📊 Found ${partners.length} partners`)

    // Show current status breakdown
    const statusCounts = partners.reduce((acc, partner) => {
      acc[partner.partner_status] = (acc[partner.partner_status] || 0) + 1
      return acc
    }, {})

    console.log('Current partner status:', statusCounts)

    // 2. Filter partners that need approval
    const partnersToApprove = partners.filter(p => 
      p.partner_status && ['pending', 'under_review', 'inactive'].includes(p.partner_status)
    )

    if (partnersToApprove.length === 0) {
      console.log('✅ All partners are already approved or in a non-approvable state')
      return NextResponse.json({
        success: true,
        message: 'All partners are already approved or in a non-approvable state',
        totalPartners: partners.length,
        approvedCount: 0,
        statusCounts
      })
    }

    console.log(`🚀 Approving ${partnersToApprove.length} partners...`)

    // 3. Approve all partners that need approval
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        partner_status: 'active',
        is_verified: true,
        is_active: true,
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_type', 'partner')
      .in('partner_status', ['pending', 'under_review', 'inactive'])
      .select('id, email, full_name, partner_status')

    if (updateError) {
      console.error('❌ Error updating partners:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update partners',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log(`✅ Successfully approved ${updateResult.length} partners`)

    // 4. Get final status
    const { data: finalPartners, error: finalError } = await supabase
      .from('users')
      .select('partner_status, is_verified, is_active')
      .eq('user_type', 'partner')

    let finalStatusCounts = {}
    if (!finalError && finalPartners) {
      finalStatusCounts = finalPartners.reduce((acc, partner) => {
        const status = partner.partner_status
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
    }

    console.log('Final partner status:', finalStatusCounts)

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${updateResult.length} partners`,
      totalPartners: partners.length,
      approvedCount: updateResult.length,
      approvedPartners: updateResult.map(p => ({
        id: p.id,
        email: p.email,
        name: p.full_name
      })),
      initialStatusCounts: statusCounts,
      finalStatusCounts
    })

  } catch (error) {
    console.error('❌ Error in bulk partner approval:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current partner status overview
    const { data: partners, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, partner_status, is_verified, is_active, created_at')
      .eq('user_type', 'partner')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch partners' 
      }, { status: 500 })
    }

    const statusCounts = partners.reduce((acc, partner) => {
      acc[partner.partner_status] = (acc[partner.partner_status] || 0) + 1
      return acc
    }, {})

    const partnersNeedingApproval = partners.filter(p => 
      p.partner_status && ['pending', 'under_review', 'inactive'].includes(p.partner_status)
    )

    return NextResponse.json({
      success: true,
      totalPartners: partners.length,
      statusCounts,
      partnersNeedingApproval: partnersNeedingApproval.length,
      partners: partners.map(p => ({
        id: p.id,
        email: p.email,
        name: p.full_name,
        company: p.company_name,
        status: p.partner_status,
        isVerified: p.is_verified,
        isActive: p.is_active,
        createdAt: p.created_at
      }))
    })

  } catch (error) {
    console.error('❌ Error fetching partner status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
