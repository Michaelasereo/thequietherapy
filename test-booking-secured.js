// 🧪 SECURED BOOKING FLOW TEST SCRIPT
// Tests the secured booking endpoints with proper authentication
// Run with: node test-booking-secured.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Configuration - UPDATE THESE WITH YOUR TEST DATA
const TEST_USER = {
  email: 'obgynect@gmail.com', // Change to your test user email
  password: 'test123' // Optional: if you need to login
};

const TEST_THERAPIST = {
  id: '1229dfcb-db86-43d0-ad3b-988fcef6c2e1', // Change to valid therapist ID
  email: 'michaelasereo@gmail.com'
};

// Helper to make authenticated requests
let authCookies = '';

async function login() {
  console.log('\n🔐 Step 0: Authenticating...');
  
  try {
    // Option 1: Use test-login endpoint if available
    const loginResponse = await fetch(`${BASE_URL}/api/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Authenticated via test-login endpoint');
      
      // Extract cookies from response
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        authCookies = setCookieHeader;
        console.log('✅ Session cookies obtained');
      }
      
      return { success: true, token: loginData.session_token, cookies: authCookies };
    }
  } catch (error) {
    console.log('⚠️  Test-login endpoint not available, trying alternative...');
  }
  
  // Option 2: Direct session creation (if you have service role key)
  console.log('⚠️  Manual authentication required');
  console.log('   Please authenticate first by:');
  console.log('   1. Logging in through the browser');
  console.log('   2. Copying session cookies from browser DevTools');
  console.log('   3. Setting them in this script');
  
  return { success: false };
}

async function makeAuthenticatedRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add cookies if available
  if (authCookies) {
    headers['Cookie'] = authCookies;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Important for cookies
  });
}

// Test 1: Unauthenticated booking should fail
async function testUnauthenticatedBooking() {
  console.log('\n🚫 Test 1: Testing unauthenticated booking (should fail)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapist_id: TEST_THERAPIST.id,
        session_date: '2025-12-20',
        start_time: '10:00',
        duration: 60
      })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthenticated booking');
      console.log(`   Error: ${result.error || 'Unauthorized'}`);
      return true;
    } else {
      console.log('❌ FAILED: Should have returned 401');
      console.log(`   Got: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Test 2: book-simple endpoint should require auth
async function testBookSimpleRequiresAuth() {
  console.log('\n🚫 Test 2: Testing book-simple endpoint (should require auth)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/sessions/book-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapist_id: TEST_THERAPIST.id,
        session_date: '2025-12-20',
        start_time: '10:00'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ book-simple correctly requires authentication');
      return true;
    } else {
      console.log('❌ FAILED: book-simple should require auth');
      console.log(`   Got: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Test 3: Authenticated booking
async function testAuthenticatedBooking() {
  console.log('\n✅ Test 3: Testing authenticated booking...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  const bookingData = {
    therapist_id: TEST_THERAPIST.id,
    session_date: sessionDate,
    start_time: '10:00',
    duration: 60,
    session_type: 'video',
    notes: 'Test booking from automated test script'
  };
  
  try {
    console.log(`   Booking for: ${sessionDate} at 10:00`);
    console.log(`   Therapist: ${TEST_THERAPIST.id}`);
    
    const response = await makeAuthenticatedRequest(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.data?.session) {
      console.log('✅ Booking created successfully!');
      console.log(`   Session ID: ${result.data.session.id}`);
      console.log(`   Status: ${result.data.session.status}`);
      console.log(`   Scheduled: ${result.data.session.scheduled_date} at ${result.data.session.scheduled_time}`);
      return { success: true, sessionId: result.data.session.id };
    } else {
      console.log('❌ Booking failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || JSON.stringify(result)}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Double-booking prevention (database constraint)
async function testDoubleBookingPrevention(previousSessionId) {
  console.log('\n🛡️  Test 4: Testing double-booking prevention...');
  
  if (!previousSessionId) {
    console.log('⚠️  Skipping: No previous session ID available');
    return false;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  const bookingData = {
    therapist_id: TEST_THERAPIST.id,
    session_date: sessionDate,
    start_time: '10:00', // Same time as previous booking
    duration: 60,
    session_type: 'video'
  };
  
  try {
    console.log('   Attempting to book overlapping session...');
    
    const response = await makeAuthenticatedRequest(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (response.status === 409 || response.status === 400) {
      console.log('✅ Correctly prevented double-booking');
      console.log(`   Error: ${result.error || 'Time slot already booked'}`);
      return true;
    } else if (response.ok) {
      console.log('❌ FAILED: Should have prevented double-booking');
      console.log('   Database constraint may not be working correctly');
      return false;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      console.log(`   Result: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Test 5: Insufficient credits
async function testInsufficientCredits() {
  console.log('\n💰 Test 5: Testing insufficient credits check...');
  console.log('   (This test requires a user with 0 credits)');
  console.log('   ⚠️  Skipping for now - manually test with 0-credit user');
  return true;
}

// Test 6: Verify booking appears in sessions list
async function testSessionList() {
  console.log('\n📋 Test 6: Testing session list retrieval...');
  
  try {
    const response = await makeAuthenticatedRequest(`${BASE_URL}/api/sessions/book`, {
      method: 'GET'
    });
    
    const result = await response.json();
    
    if (response.ok && result.data?.sessions) {
      console.log('✅ Successfully retrieved sessions');
      console.log(`   Found ${result.data.sessions.length} session(s)`);
      
      if (result.data.sessions.length > 0) {
        const latest = result.data.sessions[0];
        console.log(`   Latest: ${latest.scheduled_date} at ${latest.scheduled_time}`);
        console.log(`   Status: ${latest.status}`);
      }
      
      return true;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 SECURED BOOKING SYSTEM TEST SUITE');
  console.log('====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log(`Test Therapist: ${TEST_THERAPIST.id}`);
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Test authentication
  const authResult = await login();
  
  if (!authResult.success && !authCookies) {
    console.log('\n⚠️  WARNING: Authentication not configured');
    console.log('   Some tests will fail. Please set authCookies manually.');
    console.log('   You can get cookies from browser DevTools after logging in.');
  }
  
  // Test 1: Unauthenticated booking
  const test1 = await testUnauthenticatedBooking();
  test1 ? results.passed++ : results.failed++;
  
  // Test 2: book-simple requires auth
  const test2 = await testBookSimpleRequiresAuth();
  test2 ? results.passed++ : results.failed++;
  
  // Test 3: Authenticated booking (only if auth available)
  let sessionId = null;
  if (authResult.success || authCookies) {
    const test3 = await testAuthenticatedBooking();
    if (test3.success) {
      sessionId = test3.sessionId;
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    console.log('\n⏭️  Skipping authenticated tests (no auth configured)');
    results.skipped++;
  }
  
  // Test 4: Double-booking prevention
  if (sessionId) {
    const test4 = await testDoubleBookingPrevention(sessionId);
    test4 ? results.passed++ : results.failed++;
  } else {
    console.log('\n⏭️  Skipping double-booking test (no session created)');
    results.skipped++;
  }
  
  // Test 5: Insufficient credits (manual test)
  await testInsufficientCredits();
  results.skipped++;
  
  // Test 6: Session list
  if (authResult.success || authCookies) {
    const test6 = await testSessionList();
    test6 ? results.passed++ : results.failed++;
  } else {
    results.skipped++;
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
  }
}

// Run tests
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testUnauthenticatedBooking,
  testAuthenticatedBooking,
  testDoubleBookingPrevention,
  login,
  makeAuthenticatedRequest
};

