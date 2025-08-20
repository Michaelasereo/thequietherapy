const fetch = require('node-fetch');

async function simpleTest() {
  console.log('🧪 Simple Paystack Test...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server...');
    const response = await fetch('http://localhost:3002/api/credits/packages');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ JSON parsed successfully');
        console.log('Data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('❌ Not valid JSON');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest();
