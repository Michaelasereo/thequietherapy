#!/usr/bin/env node

/**
 * Quick test to check if the schedule-next-session API is working
 * This will show us the exact error
 */

const API_URL = 'http://localhost:3000/api/therapist/schedule-next-session';

// Test data
const testData = {
  patientId: 'test-patient-id',
  scheduledDate: '2024-10-20',
  scheduledTime: '10:00',
  durationMinutes: 30,
  notes: 'Test session'
};

console.log('🧪 Testing Schedule Next Session API...\n');
console.log('📤 Sending request to:', API_URL);
console.log('📦 Request body:', JSON.stringify(testData, null, 2));
console.log('\n⏳ Waiting for response...\n');

fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(async response => {
    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('\n❌ ERROR RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.details) {
        console.log('\n🔍 Error Details:', data.details);
      }
      if (data.hint) {
        console.log('💡 Hint:', data.hint);
      }
      if (data.code) {
        console.log('🏷️  Error Code:', data.code);
      }
    } else {
      console.log('\n✅ SUCCESS:');
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(error => {
    console.error('\n💥 Network Error:', error.message);
    console.error('\n⚠️  Make sure your dev server is running (npm run dev)');
  });

