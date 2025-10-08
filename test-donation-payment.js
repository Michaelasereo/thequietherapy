const BASE_URL = 'http://localhost:3000'

async function testDonationPayment() {
  console.log('🧪 Testing Donation Payment Flow...\n')
  console.log('=' .repeat(80))

  // Step 1: Initiate donation
  console.log('\n📤 Step 1: Initiating donation...')
  
  const donationData = {
    amount: 5000,
    email: 'test@example.com',
    name: 'Test Donor',
    anonymous: false
  }

  try {
    const response = await fetch(`${BASE_URL}/api/donations/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to initiate donation:', result.error)
      return
    }

    console.log('✅ Donation initiated successfully!')
    console.log(`   Amount: ₦${donationData.amount.toLocaleString()}`)
    console.log(`   Reference: ${result.reference}`)
    console.log(`   Payment URL: ${result.payment_url}`)

    console.log('\n' + '=' .repeat(80))
    console.log('📋 NEXT STEPS:')
    console.log('=' .repeat(80))
    console.log('\n1. Open the payment URL in your browser:')
    console.log(`   ${result.payment_url}`)
    console.log('\n2. Use Paystack test card:')
    console.log('   Card Number: 4084 0840 8408 4081')
    console.log('   CVV: 408')
    console.log('   PIN: 0000')
    console.log('   Expiry: Any future date (e.g., 12/25)')
    console.log('\n3. After payment, check stats:')
    console.log(`   ${BASE_URL}/api/donations/stats`)
    console.log('\n4. View on support page:')
    console.log(`   ${BASE_URL}/support`)

    console.log('\n' + '=' .repeat(80))
    console.log('⏳ Waiting for payment...')
    console.log('   (The donation is now "pending" in the database)')
    console.log('   (It will become "success" after Paystack webhook fires)')
    console.log('=' .repeat(80))

    // Step 2: Check if donation was created
    console.log('\n📊 Step 2: Checking donation in database...')
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    
    const statsResponse = await fetch(`${BASE_URL}/api/donations/stats`)
    const stats = await statsResponse.json()
    
    console.log('\n✅ Current donation stats:')
    console.log(`   Total Raised: ₦${stats.data.raised.toLocaleString()}`)
    console.log(`   Total Donors: ${stats.data.donors}`)
    console.log(`   Total Records: ${stats.data.totalRecords}`)
    
    console.log('\n💡 TIP: The new donation might be in "pending" status.')
    console.log('   Complete the payment on Paystack to see it count!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the test
testDonationPayment()

