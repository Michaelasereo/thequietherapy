#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function approveAllPartners() {
  try {
    console.log('🔍 Checking current partner status...')
    
    // 1. Get all partners and their current status
    const { data: partners, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, organization_type, partner_status, is_verified, is_active, created_at')
      .eq('user_type', 'partner')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching partners:', fetchError)
      return
    }

    console.log(`📊 Found ${partners.length} partners:`)
    
    // Show current status
    const statusCounts = partners.reduce((acc, partner) => {
      acc[partner.partner_status] = (acc[partner.partner_status] || 0) + 1
      return acc
    }, {})

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })

    // 2. Approve all partners that are not already active
    const partnersToApprove = partners.filter(p => 
      p.partner_status && ['pending', 'under_review', 'inactive'].includes(p.partner_status)
    )

    if (partnersToApprove.length === 0) {
      console.log('✅ All partners are already approved or in a non-approvable state')
      return
    }

    console.log(`\n🚀 Approving ${partnersToApprove.length} partners...`)

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
      return
    }

    console.log(`✅ Successfully approved ${updateResult.length} partners:`)
    updateResult.forEach(partner => {
      console.log(`   - ${partner.email} (${partner.full_name})`)
    })

    // 3. Show final status
    console.log('\n📊 Final partner status:')
    const { data: finalPartners, error: finalError } = await supabase
      .from('users')
      .select('partner_status, is_verified, is_active')
      .eq('user_type', 'partner')

    if (!finalError && finalPartners) {
      const finalStatusCounts = finalPartners.reduce((acc, partner) => {
        const status = partner.partner_status
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      Object.entries(finalStatusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }

    console.log('\n🎉 Partner approval process completed!')

  } catch (error) {
    console.error('❌ Error in partner approval process:', error)
  }
}

// Run the approval process
approveAllPartners()
