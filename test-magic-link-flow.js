const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

async function testMagicLinkFlow() {
  console.log('🧪 Testing Complete Magic Link Flow...\\n');

  // Test 1: Individual User Magic Link Creation
  console.log('1. Testing Individual User Magic Link Creation...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        userType: 'individual'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginData);
    
    if (loginData.success) {
      console.log('   ✅ Individual magic link creation successful\\n');
    } else {
      console.log('   ❌ Individual magic link creation failed\\n');
    }
  } catch (error) {
    console.log('   ❌ Individual magic link creation error:', error.message, '\\n');
  }

  // Test 2: Therapist Magic Link Creation
  console.log('2. Testing Therapist Magic Link Creation...');
  try {
    const therapistResponse = await fetch(`${BASE_URL}/api/therapist/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'therapist@example.com'
      })
    });
    
    const therapistData = await therapistResponse.json();
    console.log('   Status:', therapistResponse.status);
    console.log('   Response:', therapistData);
    
    if (therapistData.success) {
      console.log('   ✅ Therapist magic link creation successful\\n');
    } else {
      console.log('   ❌ Therapist magic link creation failed\\n');
    }
  } catch (error) {
    console.log('   ❌ Therapist magic link creation error:', error.message, '\\n');
  }

  // Test 3: Partner Magic Link Creation
  console.log('3. Testing Partner Magic Link Creation...');
  try {
    const partnerResponse = await fetch(`${BASE_URL}/api/partner/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'partner@example.com'
      })
    });
    
    const partnerData = await partnerResponse.json();
    console.log('   Status:', partnerResponse.status);
    console.log('   Response:', partnerData);
    
    if (partnerData.success) {
      console.log('   ✅ Partner magic link creation successful\\n');
    } else {
      console.log('   ❌ Partner magic link creation failed\\n');
    }
  } catch (error) {
    console.log('   ❌ Partner magic link creation error:', error.message, '\\n');
  }

  // Test 4: Magic Link Verification Endpoints
  console.log('4. Testing Magic Link Verification Endpoints...');
  
  const verificationTests = [
    {
      name: 'Individual Verification',
      endpoint: '/api/auth/verify-magic-link',
      token: 'test-token-123',
      userType: 'individual'
    },
    {
      name: 'Therapist Verification',
      endpoint: '/api/therapist/verify-magic-link',
      token: 'test-token-456'
    },
    {
      name: 'Partner Verification',
      endpoint: '/api/partner/verify-magic-link',
      token: 'test-token-789'
    }
  ];

  for (const test of verificationTests) {
    console.log(`   Testing ${test.name}...`);
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: test.token,
          userType: test.userType
        })
      });
      
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      
      if (response.status === 400 && data.error) {
        console.log(`   ✅ ${test.name} endpoint working (correctly rejecting invalid token)\\n`);
      } else {
        console.log(`   ⚠️ ${test.name} endpoint response unexpected\\n`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} error:`, error.message, '\\n');
    }
  }

  // Test 5: Check if magic links table exists and is accessible
  console.log('5. Testing Database Access...');
  try {
    const dbTestResponse = await fetch(`${BASE_URL}/api/test-magic-link`, {
      method: 'GET'
    });
    
    const dbTestData = await dbTestResponse.json();
    console.log('   Status:', dbTestResponse.status);
    console.log('   Response:', dbTestData);
    
    if (dbTestData.success) {
      console.log('   ✅ Database access working\\n');
    } else {
      console.log('   ❌ Database access failed\\n');
    }
  } catch (error) {
    console.log('   ❌ Database test error:', error.message, '\\n');
  }

  console.log('🎯 Magic Link Flow Test Complete!');
}

testMagicLinkFlow().catch(console.error);
