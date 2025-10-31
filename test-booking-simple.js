// 🧪 SIMPLE BOOKING TEST
// Run: node test-booking-simple.js

const BASE_URL = 'http://localhost:3000';

// UPDATE THESE VALUES
const THERAPIST_ID = '1229dfcb-db86-43d0-ad3b-988fcef6c2e1'; // Your therapist ID
const USER_EMAIL = 'obgynect@gmail.com'; // Your test user email

async function testBooking() {
  console.log('🧪 Testing Booking System\n');
  
  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDate = tomorrow.toISOString().split('T')[0];
  
  console.log(`📅 Testing booking for: ${sessionDate} at 10:00`);
  console.log(`👨‍⚕️ Therapist ID: ${THERAPIST_ID}\n`);
  
  // Test 1: Unauthenticated (should fail)
  console.log('🚫 Test 1: Unauthenticated booking (should fail)...');
  try {
    const res1 = await fetch(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapist_id: THERAPIST_ID,
        session_date: sessionDate,
        start_time: '10:00',
        duration: 60
      })
    });
    
    const result1 = await res1.json();
    if (res1.status === 401) {
      console.log('✅ Correctly rejected (401 Unauthorized)\n');
    } else {
      console.log(`❌ Expected 401, got ${res1.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  // Test 2: Try authenticated booking (requires cookie)
  console.log('✅ Test 2: Authenticated booking...');
  console.log('⚠️  Note: This requires authentication cookie.');
  console.log('   If you see 401, authenticate first via browser login.\n');
  
  // Try to authenticate first
  console.log('🔐 Attempting authentication...');
  try {
    const authRes = await fetch(`${BASE_URL}/api/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL })
    });
    
    if (authRes.ok) {
      const authData = await authRes.json();
      console.log(`✅ Authenticated as: ${authData.user?.email}`);
      
      // Get cookies from response
      const cookies = authRes.headers.get('set-cookie');
      
      // Try booking with auth
      const bookingRes = await fetch(`${BASE_URL}/api/sessions/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          therapist_id: THERAPIST_ID,
          session_date: sessionDate,
          start_time: '10:00',
          duration: 60,
          session_type: 'video',
          notes: 'Simple test booking'
        })
      });
      
      const bookingResult = await bookingRes.json();
      
      if (bookingRes.ok && bookingResult.data?.session) {
        console.log('✅ Booking successful!');
        console.log(`   Session ID: ${bookingResult.data.session.id}`);
        console.log(`   Date: ${bookingResult.data.session.scheduled_date}`);
        console.log(`   Time: ${bookingResult.data.session.scheduled_time}`);
        console.log(`   Status: ${bookingResult.data.session.status}`);
        return bookingResult.data.session.id;
      } else {
        console.log('❌ Booking failed');
        console.log(`   Status: ${bookingRes.status}`);
        console.log(`   Error: ${bookingResult.error || JSON.stringify(bookingResult)}`);
      }
    } else {
      console.log('⚠️  Could not authenticate automatically');
      console.log('   Please log in via browser and test manually.\n');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('   Make sure your server is running on', BASE_URL);
  }
  
  console.log('\n📝 To test manually in browser:');
  console.log('   1. Log in at http://localhost:3000');
  console.log('   2. Open browser console');
  console.log('   3. Run:');
  console.log(`
      fetch('/api/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          therapist_id: '${THERAPIST_ID}',
          session_date: '${sessionDate}',
          start_time: '10:00',
          duration: 60,
          session_type: 'video'
        })
      }).then(r => r.json()).then(console.log);
  `);
}

testBooking().catch(console.error);

