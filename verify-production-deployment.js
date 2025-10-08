const PRODUCTION_URL = 'https://thequietherapy.live'

console.log('🔍 Verifying Production Deployment...\n')
console.log('Site:', PRODUCTION_URL)
console.log('=' .repeat(80))

async function verifyEndpoint(name, url, expectedKeys = []) {
  try {
    console.log(`\n📡 Testing: ${name}`)
    console.log(`   URL: ${url}`)
    
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    const contentType = response.headers.get('content-type')
    
    if (!response.ok) {
      console.log(`   ❌ FAILED - Status: ${response.status}`)
      const text = await response.text()
      console.log(`   Error: ${text.substring(0, 200)}`)
      return false
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`   ⚠️  WARNING - Not JSON response`)
      console.log(`   Content-Type: ${contentType}`)
      return false
    }
    
    const data = await response.json()
    
    // Check for expected keys
    const missingKeys = expectedKeys.filter(key => !(key in data))
    if (missingKeys.length > 0) {
      console.log(`   ⚠️  Missing keys: ${missingKeys.join(', ')}`)
    }
    
    console.log(`   ✅ SUCCESS - Status: ${response.status}`)
    console.log(`   Response keys:`, Object.keys(data).join(', '))
    
    // Show some data
    if (data.success !== undefined) {
      console.log(`   Success: ${data.success}`)
    }
    if (data.data) {
      if (data.data.raised !== undefined) {
        console.log(`   Raised: ₦${data.data.raised.toLocaleString()}`)
      }
      if (data.data.donors !== undefined) {
        console.log(`   Donors: ${data.data.donors}`)
      }
    }
    if (data.summary) {
      console.log(`   Total Donations: ${data.summary.totalDonations}`)
      console.log(`   Successful: ₦${data.summary.successfulAmount.toLocaleString()}`)
      console.log(`   Pending: ₦${data.summary.pendingAmount.toLocaleString()}`)
    }
    
    return true
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return false
  }
}

async function verifyPage(name, url) {
  try {
    console.log(`\n📄 Testing: ${name}`)
    console.log(`   URL: ${url}`)
    
    const response = await fetch(url, {
      cache: 'no-cache'
    })
    
    if (!response.ok) {
      console.log(`   ❌ FAILED - Status: ${response.status}`)
      return false
    }
    
    const html = await response.text()
    const hasContent = html.length > 100
    
    console.log(`   ✅ SUCCESS - Status: ${response.status}`)
    console.log(`   Page size: ${(html.length / 1024).toFixed(2)} KB`)
    console.log(`   Has content: ${hasContent ? 'Yes' : 'No'}`)
    
    return true
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return false
  }
}

async function runVerification() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  }
  
  console.log('\n🧪 TESTING API ENDPOINTS')
  console.log('=' .repeat(80))
  
  // Test Stats API
  const statsResult = await verifyEndpoint(
    'Donation Stats API (Public)',
    `${PRODUCTION_URL}/api/donations/stats`,
    ['success', 'data', 'diagnostics', 'timestamp']
  )
  results.total++
  statsResult ? results.passed++ : results.failed++
  
  // Debug API removed - skip test
  console.log('\n📡 Testing: Donation Debug API')
  console.log(`   URL: ${PRODUCTION_URL}/api/donations/debug`)
  console.log('   ℹ️  SKIPPED - Debug API removed from production')
  
  console.log('\n\n📱 TESTING PAGES')
  console.log('=' .repeat(80))
  
  // Test Support Page
  const supportResult = await verifyPage(
    'Support/Donation Page',
    `${PRODUCTION_URL}/support`
  )
  results.total++
  supportResult ? results.passed++ : results.failed++
  
  // Test Debug Console
  const consoleResult = await verifyPage(
    'Debug Console',
    `${PRODUCTION_URL}/admin/donations-debug`
  )
  results.total++
  consoleResult ? results.passed++ : results.failed++
  
  // Final Summary
  console.log('\n\n' + '=' .repeat(80))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('=' .repeat(80))
  console.log(`Total Tests: ${results.total}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  
  const percentage = ((results.passed / results.total) * 100).toFixed(0)
  console.log(`\n📈 Success Rate: ${percentage}%`)
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Production deployment successful!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
  
  console.log('\n' + '=' .repeat(80))
  console.log('🔗 QUICK LINKS')
  console.log('=' .repeat(80))
  console.log(`\n📊 Debug Console:`)
  console.log(`   ${PRODUCTION_URL}/admin/donations-debug`)
  console.log(`\n💰 Support Page:`)
  console.log(`   ${PRODUCTION_URL}/support`)
  console.log(`\n📡 Stats API:`)
  console.log(`   ${PRODUCTION_URL}/api/donations/stats`)
  console.log(`\n🐛 Debug API:`)
  console.log(`   ${PRODUCTION_URL}/api/donations/debug`)
  
  console.log('\n' + '=' .repeat(80))
  console.log('⚠️  IMPORTANT REMINDERS')
  console.log('=' .repeat(80))
  console.log('\n1. Update Paystack Webhook URL:')
  console.log(`   https://dashboard.paystack.com/#/settings/webhooks`)
  console.log(`   Set to: ${PRODUCTION_URL}/api/donations/webhook`)
  console.log('\n2. Verify environment variables in Netlify:')
  console.log('   - PAYSTACK_SECRET_KEY (Live key)')
  console.log('   - NEXT_PUBLIC_SUPABASE_URL')
  console.log('   - SUPABASE_SERVICE_ROLE_KEY')
  console.log(`   - NEXT_PUBLIC_APP_URL=${PRODUCTION_URL}`)
  console.log('\n3. Test with a small donation to verify webhook works')
  console.log('\n4. Monitor debug console for first 24 hours')
  
  console.log('\n' + '=' .repeat(80))
  
  return results.failed === 0
}

// Run verification
runVerification().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n❌ Verification failed:', error)
  process.exit(1)
})

