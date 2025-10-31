// 🌐 BROWSER BOOKING TEST (Run in browser console)
// Copy and paste this into your browser console while logged in

const BASE_URL = window.location.origin;

const TEST_THERAPIST = {
  id: '1229dfcb-db86-43d0-ad3b-988fcef6c2e1', // UPDATE THIS
  email: 'michaelasereo@gmail.com'
};

// Test 1: Unauthenticated booking (should fail)
async function testUnauthenticated() {
  console.log('🚫 Test 1: Unauthenticated booking (should fail)...');
  
  try {
    const response = await fetch('/api/sessions/book', {
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
      console.log('✅ Correctly rejected:', result.error);
      return true;
    } else {
      console.log('❌ Should have returned 401, got:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Test 2: Authenticated booking
async function testAuthenticatedBooking() {
  console.log('\n✅ Test 2: Authenticated booking...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  try {
    const response = await fetch('/api/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({
        therapist_id: TEST_THERAPIST.id,
        session_date: sessionDate,
        start_time: '10:00',
        duration: 60,
        session_type: 'video',
        notes: 'Browser console test booking'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.data?.session) {
      console.log('✅ Booking successful!');
      console.log('   Session ID:', result.data.session.id);
      console.log('   Date:', result.data.session.scheduled_date);
      console.log('   Time:', result.data.session.scheduled_time);
      console.log('   Status:', result.data.session.status);
      return result.data.session.id;
    } else {
      console.log('❌ Booking failed');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Test 3: Double-booking prevention
async function testDoubleBooking(sessionId) {
  console.log('\n🛡️  Test 3: Double-booking prevention...');
  
  if (!sessionId) {
    console.log('⚠️  Skipping: No session ID from previous test');
    return false;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  try {
    const response = await fetch('/api/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        therapist_id: TEST_THERAPIST.id,
        session_date: sessionDate,
        start_time: '10:00', // Same time
        duration: 60
      })
    });
    
    const result = await response.json();
    
    if (response.status === 409 || response.status === 400) {
      console.log('✅ Correctly prevented double-booking');
      console.log('   Error:', result.error || 'Time slot not available');
      return true;
    } else if (response.ok) {
      console.log('❌ FAILED: Should have prevented double-booking');
      return false;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Test 4: book-simple endpoint (should require auth)
async function testBookSimple() {
  console.log('\n🔄 Test 4: book-simple endpoint...');
  
  try {
    const response = await fetch('/api/sessions/book-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        therapist_id: TEST_THERAPIST.id,
        session_date: '2025-12-21',
        start_time: '11:00',
        duration: 60
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ book-simple works (proxied to main endpoint)');
      console.log('   Session:', result.session?.id);
      return true;
    } else if (response.status === 401) {
      console.log('✅ book-simple correctly requires auth');
      return true;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Test 5: Get sessions list
async function testSessionList() {
  console.log('\n📋 Test 5: Get sessions list...');
  
  try {
    const response = await fetch('/api/sessions/book', {
      method: 'GET',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (response.ok && result.data?.sessions) {
      console.log('✅ Sessions retrieved');
      console.log(`   Found ${result.data.sessions.length} session(s)`);
      return true;
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 BROWSER BOOKING TEST SUITE');
  console.log('==============================');
  console.log('⚠️  Make sure you are logged in before running these tests!');
  console.log(`Therapist ID: ${TEST_THERAPIST.id}`);
  console.log('');
  
  // Update therapist ID if needed
  const newTherapistId = prompt('Enter therapist ID (or press Enter to use default):');
  if (newTherapistId) {
    TEST_THERAPIST.id = newTherapistId;
    console.log(`✅ Using therapist ID: ${TEST_THERAPIST.id}`);
  }
  
  const results = [];
  
  // Test 1: Unauthenticated (may fail if already logged in)
  const test1 = await testUnauthenticated();
  results.push({ name: 'Unauthenticated booking', passed: test1 });
  
  // Test 2: Authenticated booking
  const sessionId = await testAuthenticatedBooking();
  results.push({ name: 'Authenticated booking', passed: !!sessionId });
  
  // Test 3: Double-booking prevention
  if (sessionId) {
    const test3 = await testDoubleBooking(sessionId);
    results.push({ name: 'Double-booking prevention', passed: test3 });
  }
  
  // Test 4: book-simple endpoint
  const test4 = await testBookSimple();
  results.push({ name: 'book-simple endpoint', passed: test4 });
  
  // Test 5: Session list
  const test5 = await testSessionList();
  results.push({ name: 'Session list retrieval', passed: test5 });
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  results.forEach((r, i) => {
    console.log(`${r.passed ? '✅' : '❌'} ${i + 1}. ${r.name}`);
  });
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('\n🎉 All tests passed!');
  }
}

// Export for manual testing
window.testBooking = {
  runTests,
  testUnauthenticated,
  testAuthenticatedBooking,
  testDoubleBooking,
  testBookSimple,
  testSessionList
};

console.log('✅ Booking test functions loaded!');
console.log('   Run: await testBooking.runTests()');
console.log('   Or run individual tests:');
console.log('   - testBooking.testAuthenticatedBooking()');
console.log('   - testBooking.testDoubleBooking(sessionId)');
console.log('   - etc.');

