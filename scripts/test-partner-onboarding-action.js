require('dotenv').config({ path: '.env.local' });
const { partnerOnboardingAction } = require('../actions/partner-auth.ts');

async function testPartnerOnboardingAction() {
  console.log('🧪 Testing Partner Onboarding Action...\n');

  try {
    // Create test form data
    const formData = new FormData();
    formData.append('organizationName', 'Test Company Action');
    formData.append('contactName', 'Test Contact Action');
    formData.append('email', `test-action-${Date.now()}@example.com`);
    formData.append('employeeCount', '11-50');
    formData.append('industry', 'Corporate HR');
    formData.append('termsAccepted', 'on');

    console.log('📤 Test form data:');
    for (let [key, value] of formData.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    // Test the action
    console.log('\n🚀 Calling partnerOnboardingAction...');
    const result = await partnerOnboardingAction(null, formData);

    console.log('\n📋 Action result:', result);

    if (result.success) {
      console.log('✅ Partner onboarding action successful!');
    } else {
      console.log('❌ Partner onboarding action failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPartnerOnboardingAction();
