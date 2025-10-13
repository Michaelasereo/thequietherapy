/**
 * Test Complete Magic Link Flow
 * Tests signup -> email -> verification -> dashboard redirect
 */

const testEmail = `test.flow.${Date.now()}@example.com`;
const testName = 'Flow Test User';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  console.log('\n🎯 Testing Complete Magic Link Flow\n');
  console.log('═'.repeat(70));
  
  try {
    // Step 1: Test Signup
    console.log('\n📝 STEP 1: Testing Signup...\n');
    console.log(`Email: ${testEmail}`);
    console.log(`Name: ${testName}\n`);
    
    const signupResponse = await fetch('https://thequietherapy.live/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        user_type: 'individual',
        type: 'signup',
        metadata: { first_name: testName }
      }),
    });

    const signupData = await signupResponse.json();
    console.log(`Status: ${signupResponse.status}`);
    console.log(`Response:`, JSON.stringify(signupData, null, 2));
    
    if (!signupData.success) {
      console.log('\n❌ SIGNUP FAILED');
      console.log('Error:', signupData.error);
      return false;
    }
    
    console.log('\n✅ Signup request successful - magic link sent');
    
    // Step 2: Check database for magic link
    console.log('\n🔍 STEP 2: Checking Database for Magic Link...\n');
    console.log('⚠️  Manual check required:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run: SELECT * FROM magic_links WHERE email = \'' + testEmail + '\' ORDER BY created_at DESC LIMIT 1;');
    console.log('   3. Copy the token value');
    console.log('   4. Test verification URL:\n');
    console.log(`   https://thequietherapy.live/api/auth/verify-magic-link?token=YOUR_TOKEN&auth_type=individual\n`);
    
    // Step 3: Test session check
    console.log('\n🍪 STEP 3: Testing Session Cookie Setup...\n');
    console.log('After clicking magic link, check browser:');
    console.log('   1. Open DevTools (F12)');
    console.log('   2. Go to Application > Cookies');
    console.log('   3. Look for: quiet_session');
    console.log('   4. Should be set and valid\n');
    
    // Step 4: Test auth me endpoint
    console.log('\n👤 STEP 4: Testing Auth Status...\n');
    const authResponse = await fetch('https://thequietherapy.live/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });
    
    const authData = await authResponse.json();
    console.log(`Status: ${authResponse.status}`);
    console.log(`Response:`, JSON.stringify(authData, null, 2));
    
    if (authResponse.status === 401) {
      console.log('\n⚠️  Not authenticated (expected before clicking magic link)');
    } else if (authResponse.status === 200 && authData.user) {
      console.log('\n✅ Already authenticated!');
    }
    
    console.log('\n═'.repeat(70));
    console.log('\n📋 SUMMARY:\n');
    console.log('✅ Signup endpoint: WORKING');
    console.log('✅ Magic link sent: YES');
    console.log('⏳ Magic link verification: Needs manual testing');
    console.log('⏳ Dashboard redirect: Needs manual testing\n');
    
    console.log('🔧 TO TEST MANUALLY:\n');
    console.log('1. Check your email inbox for magic link');
    console.log('2. Click the magic link');
    console.log('3. Should redirect to: https://thequietherapy.live/dashboard');
    console.log('4. Should be logged in\n');
    
    console.log('📧 Test Email:', testEmail);
    console.log('🔗 Or use real email to test actual flow\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    return false;
  }
}

// Run the test
testCompleteFlow().then(success => {
  console.log('═'.repeat(70));
  if (success) {
    console.log('\n✨ Automated tests passed - Manual verification needed\n');
  } else {
    console.log('\n❌ Tests failed - Check errors above\n');
  }
});

