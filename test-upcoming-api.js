#!/usr/bin/env node

/**
 * Test the upcoming sessions API directly
 * This will help us see if the API is working
 */

const API_URL = 'http://localhost:3000/api/sessions/upcoming';

console.log('🧪 Testing Upcoming Sessions API...\n');
console.log('📤 Request URL:', API_URL);
console.log('\n⏳ Making request...\n');

// Test without authentication first to see the response
fetch(API_URL)
  .then(async response => {
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('\n❌ ERROR RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n✅ SUCCESS RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(error => {
    console.error('\n💥 Network Error:', error.message);
    console.error('\n⚠️  Make sure your dev server is running (npm run dev)');
  });
