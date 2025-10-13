/**
 * Test Production Signup Flow
 * Tests the /api/auth/send-magic-link endpoint
 */

const testEmail = `test.${Date.now()}@example.com`;
const testName = 'Test User';

async function testSignup() {
  console.log('🧪 Testing Production Signup Flow\n');
  console.log('═'.repeat(60));
  
  const url = 'https://thequietherapy.live/api/auth/send-magic-link';
  
  console.log(`\n📧 Test Email: ${testEmail}`);
  console.log(`👤 Test Name: ${testName}`);
  console.log(`🔗 Testing URL: ${url}\n`);
  
  try {
    console.log('⏳ Sending signup request...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        user_type: 'individual',
        type: 'signup',
        metadata: {
          first_name: testName
        }
      }),
    });

    const status = response.status;
    const statusText = response.statusText;
    
    console.log(`📊 Response Status: ${status} ${statusText}\n`);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Could not parse response as JSON' };
    }
    
    console.log('📦 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n' + '═'.repeat(60));
    
    // Analyze the result
    if (status === 200 && data.success) {
      console.log('\n✅ SUCCESS! Signup is working!\n');
      console.log('✓ Status: 200 OK');
      console.log('✓ Magic link creation: SUCCESS');
      console.log('✓ Response: ' + (data.message || 'OK'));
      console.log('\n🎉 Your signup flow is LIVE and working!\n');
      return true;
    } else if (status === 502) {
      console.log('\n❌ FAILED: 502 Bad Gateway\n');
      console.log('💡 This means:');
      console.log('   1. The serverless function crashed');
      console.log('   2. Likely missing audit_logs table in Supabase');
      console.log('   3. Or missing environment variables\n');
      console.log('🔧 Fix:');
      console.log('   1. Run the SQL script to create audit_logs table');
      console.log('   2. Add BREVO_API_KEY to Netlify');
      console.log('   3. Redeploy\n');
      console.log('📄 See: FIX_SIGNUP_NOW.md for details\n');
      return false;
    } else if (status === 500) {
      console.log('\n❌ FAILED: 500 Internal Server Error\n');
      console.log('💡 This means:');
      console.log('   - Server error occurred');
      console.log('   - Check Netlify function logs\n');
      console.log('🔗 Logs: https://app.netlify.com/projects/thequietherapy/logs/functions\n');
      return false;
    } else if (status === 429) {
      console.log('\n⚠️  Rate Limited\n');
      console.log('Too many requests. Wait a moment and try again.\n');
      return false;
    } else {
      console.log('\n⚠️  Unexpected Response\n');
      console.log(`Status: ${status}`);
      console.log(`Message: ${data.error || data.message || 'Unknown error'}\n`);
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ NETWORK ERROR\n');
    console.error('Error:', error.message);
    console.log('\n💡 This could mean:');
    console.log('   - Network connectivity issue');
    console.log('   - Site is down');
    console.log('   - CORS issue\n');
    return false;
  }
}

// Run the test
console.log('\n🚀 Starting Production Signup Test...\n');
testSignup().then(success => {
  console.log('═'.repeat(60));
  if (success) {
    console.log('\n✨ TEST PASSED - Ready to onboard users!\n');
    process.exit(0);
  } else {
    console.log('\n❌ TEST FAILED - See errors above\n');
    process.exit(1);
  }
});

