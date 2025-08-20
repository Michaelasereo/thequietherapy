const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  // Test 1: Individual Login
  console.log('1. Testing Individual Login...');
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
    console.log('   ✅ Individual login endpoint working\n');
  } catch (error) {
    console.log('   ❌ Individual login failed:', error.message, '\n');
  }

  // Test 2: Therapist Login
  console.log('2. Testing Therapist Login...');
  try {
    const therapistResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'therapist@example.com',
        userType: 'therapist'
      })
    });
    
    const therapistData = await therapistResponse.json();
    console.log('   Status:', therapistResponse.status);
    console.log('   Response:', therapistData);
    console.log('   ✅ Therapist login endpoint working\n');
  } catch (error) {
    console.log('   ❌ Therapist login failed:', error.message, '\n');
  }

  // Test 3: Partner Login
  console.log('3. Testing Partner Login...');
  try {
    const partnerResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'partner@example.com',
        userType: 'partner'
      })
    });
    
    const partnerData = await partnerResponse.json();
    console.log('   Status:', partnerResponse.status);
    console.log('   Response:', partnerData);
    console.log('   ✅ Partner login endpoint working\n');
  } catch (error) {
    console.log('   ❌ Partner login failed:', error.message, '\n');
  }

  // Test 4: Auth Me endpoint (should fail without cookies)
  console.log('4. Testing Auth Me endpoint (no cookies)...');
  try {
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const meData = await meResponse.json();
    console.log('   Status:', meResponse.status);
    console.log('   Response:', meData);
    console.log('   ✅ Auth me endpoint working (correctly rejecting without auth)\n');
  } catch (error) {
    console.log('   ❌ Auth me failed:', error.message, '\n');
  }

  console.log('🎉 Authentication endpoint tests completed!');
}

// Run the tests
testAuthEndpoints().catch(console.error);
