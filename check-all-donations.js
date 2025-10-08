const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Checking ALL donations in database...\n')
console.log('📊 Supabase Project:', supabaseUrl)
console.log('=' .repeat(80))

async function checkAllDonations() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Fetch ALL donations from the database
    const { data: donations, error, count } = await supabase
      .from('donations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching donations:', error.message)
      return
    }

    console.log(`\n📦 Total Donations in Database: ${count || 0}`)
    console.log('=' .repeat(80))

    if (!donations || donations.length === 0) {
      console.log('\n⚠️  No donations found in database')
      return
    }

    // Status breakdown
    const statusCount = {
      success: 0,
      pending: 0,
      failed: 0,
      cancelled: 0
    }

    let totalAmount = 0
    const uniqueEmails = new Set()

    donations.forEach(d => {
      statusCount[d.status] = (statusCount[d.status] || 0) + 1
      totalAmount += Number(d.amount) || 0
      if (d.email) uniqueEmails.add(d.email)
    })

    console.log('\n📊 STATUS BREAKDOWN:')
    console.log(`   ✅ Success:   ${statusCount.success}`)
    console.log(`   ⏳ Pending:   ${statusCount.pending}`)
    console.log(`   ❌ Failed:    ${statusCount.failed}`)
    console.log(`   🚫 Cancelled: ${statusCount.cancelled}`)
    
    console.log('\n💰 TOTALS:')
    console.log(`   Total Raised: ₦${totalAmount.toLocaleString()}`)
    console.log(`   Unique Donors: ${uniqueEmails.size}`)
    console.log(`   Average: ₦${uniqueEmails.size > 0 ? Math.round(totalAmount / uniqueEmails.size).toLocaleString() : 0}`)

    console.log('\n' + '=' .repeat(80))
    console.log('📋 ALL DONATIONS (newest first):')
    console.log('=' .repeat(80))

    donations.forEach((donation, index) => {
      const statusEmoji = {
        success: '✅',
        pending: '⏳',
        failed: '❌',
        cancelled: '🚫'
      }[donation.status] || '❓'

      console.log(`\n${index + 1}. ${statusEmoji} ${donation.status.toUpperCase()}`)
      console.log(`   ID: ${donation.id}`)
      console.log(`   Amount: ₦${Number(donation.amount).toLocaleString()}`)
      console.log(`   Donor: ${donation.donor_name}${donation.anonymous ? ' (Anonymous)' : ''}`)
      console.log(`   Email: ${donation.email}`)
      console.log(`   Reference: ${donation.paystack_reference}`)
      console.log(`   Created: ${new Date(donation.created_at).toLocaleString()}`)
      
      if (donation.verified_at) {
        console.log(`   Verified: ${new Date(donation.verified_at).toLocaleString()}`)
      }
      
      if (donation.gateway_response) {
        console.log(`   Gateway: ✅ Has response data`)
      }
      
      console.log(`   Type: ${donation.donation_type || 'N/A'}`)
    })

    console.log('\n' + '=' .repeat(80))
    console.log('✅ Query complete!\n')

    // Check for potential issues
    console.log('🔍 POTENTIAL ISSUES:')
    const pendingDonations = donations.filter(d => d.status === 'pending')
    if (pendingDonations.length > 0) {
      console.log(`\n⚠️  ${pendingDonations.length} pending donation(s) - these may need webhook processing`)
      pendingDonations.forEach(d => {
        const timeSince = Date.now() - new Date(d.created_at).getTime()
        const hoursSince = Math.floor(timeSince / (1000 * 60 * 60))
        console.log(`   - ${d.donor_name} (₦${d.amount}) - ${hoursSince} hours ago`)
      })
    }

    const failedDonations = donations.filter(d => d.status === 'failed')
    if (failedDonations.length > 0) {
      console.log(`\n❌ ${failedDonations.length} failed donation(s)`)
    }

    console.log('\n✅ All checks complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllDonations()

