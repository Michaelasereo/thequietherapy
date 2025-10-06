// 🧪 BOOKING FLOW TEST SCRIPT
// Run this script to test the booking API endpoints

const BASE_URL = 'http://localhost:3000';

// Test user data
const testUser = {
  email: 'obgynect@gmail.com',
  userId: '5803b951-f0b4-462c-b1d9-7bab27dfc5f7'
};

const testTherapist = {
  id: '9412940e-8445-4903-a6a2-16009ecebb36',
  email: 'michaelasereo@gmail.com',
  name: 'Dr Adelabu Yusuf'
};

// Test booking data
const bookingData = {
  therapistId: testTherapist.id,
  scheduledDate: '2025-10-06', // Tomorrow
  scheduledTime: '10:00:00',
  duration: 60,
  sessionType: 'individual',
  notes: 'Test session for end-to-end testing'
};

async function testBookingFlow() {
  console.log('🧪 STARTING BOOKING FLOW TEST');
  console.log('==============================');
  
  try {
    // Step 1: Check therapist availability
    console.log('\n📅 Step 1: Checking therapist availability...');
    const availabilityResponse = await fetch(`${BASE_URL}/api/therapist/availability/template?therapist_id=${testTherapist.id}`);
    const availabilityData = await availabilityResponse.json();
    
    if (availabilityData.success) {
      console.log('✅ Therapist availability loaded successfully');
      console.log(`   Available: Monday-Friday 9:00-17:00`);
    } else {
      console.log('❌ Failed to load therapist availability');
      return;
    }
    
    // Step 2: Create a test booking
    console.log('\n📝 Step 2: Creating test booking...');
    const bookingResponse = await fetch(`${BASE_URL}/api/sessions/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...bookingData,
        userId: testUser.userId,
        userEmail: testUser.email,
        therapistName: testTherapist.name
      })
    });
    
    const bookingResult = await bookingResponse.json();
    
    if (bookingResult.success) {
      console.log('✅ Test booking created successfully!');
      console.log(`   Session ID: ${bookingResult.sessionId}`);
      console.log(`   Room URL: ${bookingResult.roomUrl || 'Will be generated on join'}`);
      
      // Step 3: Verify session appears in user's sessions
      console.log('\n🔍 Step 3: Verifying session in user dashboard...');
      const sessionsResponse = await fetch(`${BASE_URL}/api/sessions?user_id=${testUser.userId}&upcoming=true`);
      const sessionsData = await sessionsResponse.json();
      
      if (sessionsData.success && sessionsData.sessions.length > 0) {
        const newSession = sessionsData.sessions.find(s => s.id === bookingResult.sessionId);
        if (newSession) {
          console.log('✅ Session appears in user dashboard');
          console.log(`   Status: ${newSession.status}`);
          console.log(`   Scheduled: ${newSession.scheduled_date} at ${newSession.scheduled_time}`);
        } else {
          console.log('❌ Session not found in user dashboard');
        }
      } else {
        console.log('❌ Failed to fetch user sessions');
      }
      
      return bookingResult.sessionId;
      
    } else {
      console.log('❌ Failed to create booking');
      console.log(`   Error: ${bookingResult.error}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return null;
  }
}

// Test session join flow
async function testSessionJoin(sessionId) {
  if (!sessionId) {
    console.log('❌ No session ID provided for join test');
    return;
  }
  
  console.log('\n🎥 Step 4: Testing session join...');
  
  try {
    const joinResponse = await fetch(`${BASE_URL}/api/sessions/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId
      })
    });
    
    const joinResult = await joinResponse.json();
    
    if (joinResult.success) {
      console.log('✅ Session join successful!');
      console.log(`   Room URL: ${joinResult.data.room_url}`);
      console.log(`   Room Name: ${joinResult.data.room_name}`);
      console.log(`   Meeting Token: ${joinResult.data.meeting_token ? 'Generated' : 'Not generated'}`);
      
      return joinResult.data;
    } else {
      console.log('❌ Failed to join session');
      console.log(`   Error: ${joinResult.error}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Join test failed with error:', error);
    return null;
  }
}

// Test session completion
async function testSessionCompletion(sessionId) {
  if (!sessionId) {
    console.log('❌ No session ID provided for completion test');
    return;
  }
  
  console.log('\n✅ Step 5: Testing session completion...');
  
  try {
    const completeResponse = await fetch(`${BASE_URL}/api/sessions/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        notes: 'Test session completed successfully',
        recordingUrl: null
      })
    });
    
    const completeResult = await completeResponse.json();
    
    if (completeResult.success) {
      console.log('✅ Session completed successfully!');
      console.log(`   Message: ${completeResult.message}`);
      if (completeResult.soapNotes) {
        console.log('✅ SOAP notes generated');
      }
      return true;
    } else {
      console.log('❌ Failed to complete session');
      console.log(`   Error: ${completeResult.error}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Completion test failed with error:', error);
    return false;
  }
}

// Test feedback submission
async function testFeedbackSubmission(sessionId) {
  if (!sessionId) {
    console.log('❌ No session ID provided for feedback test');
    return;
  }
  
  console.log('\n⭐ Step 6: Testing feedback submission...');
  
  try {
    const feedbackResponse = await fetch(`${BASE_URL}/api/sessions/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        rating: 5,
        comment: 'Excellent session! The therapist was very helpful and understanding.'
      })
    });
    
    const feedbackResult = await feedbackResponse.json();
    
    if (feedbackResult.success) {
      console.log('✅ Feedback submitted successfully!');
      console.log(`   Rating: 5/5`);
      console.log(`   Comment: Added`);
      return true;
    } else {
      console.log('❌ Failed to submit feedback');
      console.log(`   Error: ${feedbackResult.error}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Feedback test failed with error:', error);
    return false;
  }
}

// Run complete test
async function runCompleteTest() {
  console.log('🚀 RUNNING COMPLETE END-TO-END TEST');
  console.log('====================================');
  
  // Test booking flow
  const sessionId = await testBookingFlow();
  
  if (sessionId) {
    // Test session join
    const joinData = await testSessionJoin(sessionId);
    
    if (joinData) {
      console.log('\n🎯 Manual Testing Required:');
      console.log('============================');
      console.log('1. Open browser and go to: http://localhost:3000');
      console.log('2. Login as patient: obgynect@gmail.com');
      console.log('3. Navigate to session and click "Join Session"');
      console.log('4. Test video interface and features');
      console.log('5. Complete the session manually');
      
      // Test session completion (after manual testing)
      console.log('\n⏳ After manual testing, run:');
      console.log('   await testSessionCompletion("' + sessionId + '")');
      
      // Test feedback submission
      console.log('\n⏳ After completion, run:');
      console.log('   await testFeedbackSubmission("' + sessionId + '")');
    }
  }
  
  console.log('\n📖 For detailed testing guide, see: END_TO_END_TESTING_GUIDE.md');
}

// Export functions for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testBookingFlow,
    testSessionJoin,
    testSessionCompletion,
    testFeedbackSubmission,
    runCompleteTest
  };
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined') {
  runCompleteTest();
}
