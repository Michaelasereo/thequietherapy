/**
 * Test Paystack Payment Integration
 * Run with: node test-payment.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function testPaystackConnection() {
  console.log('🧪 Testing Paystack API Connection...\n');
  
  // Test 1: Check if secret key is set
  console.log('1️⃣ Checking PAYSTACK_SECRET_KEY...');
  if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY.includes('...')) {
    console.log('   ❌ PAYSTACK_SECRET_KEY not set or invalid');
    console.log('   💡 Set it in .env.local: PAYSTACK_SECRET_KEY=sk_test_...\n');
    return;
  }
  console.log('   ✅ PAYSTACK_SECRET_KEY is set (length:', PAYSTACK_SECRET_KEY.length, ')\n');

  // Test 2: Verify Paystack API connection
  console.log('2️⃣ Testing Paystack API connection...');
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?currency=NGN`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok && data.status) {
      console.log('   ✅ Paystack API connection successful');
      console.log('   📊 Response status:', data.status);
      console.log('   📦 Number of banks:', data.data?.length || 0, '\n');
    } else {
      console.log('   ❌ Paystack API returned error');
      console.log('   📄 Response:', JSON.stringify(data, null, 2), '\n');
      return;
    }
  } catch (error) {
    console.log('   ❌ Failed to connect to Paystack API');
    console.log('   🔴 Error:', error.message, '\n');
    return;
  }

  // Test 3: Test payment initialization
  console.log('3️⃣ Testing payment initialization...');
  const testPaymentData = {
    email: 'test@example.com',
    amount: 500000, // 5000 NGN in kobo
    reference: `test_${Date.now()}`,
    metadata: {
      test: true,
      user_id: 'test-user-id',
      package_type: 'test_package'
    },
    callback_url: 'https://thequietherapy.live/dashboard/book?payment=success'
  };

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPaymentData)
    });

    const result = await response.json();
    
    console.log('   📡 Request sent to:', `${PAYSTACK_BASE_URL}/transaction/initialize`);
    console.log('   📦 Response status:', response.status, response.statusText);
    console.log('   ✅ Paystack status:', result.status);
    
    if (result.status) {
      console.log('   ✅ Payment initialization successful!');
      console.log('   🔗 Authorization URL:', result.data?.authorization_url || 'Not provided');
      console.log('   📝 Reference:', result.data?.reference || 'Not provided');
      console.log('   💰 Amount:', (testPaymentData.amount / 100).toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }), '\n');
    } else {
      console.log('   ❌ Payment initialization failed');
      console.log('   📄 Error message:', result.message);
      console.log('   📋 Full response:', JSON.stringify(result, null, 2), '\n');
    }
  } catch (error) {
    console.log('   ❌ Failed to initialize payment');
    console.log('   🔴 Error:', error.message);
    console.log('   📋 Stack:', error.stack, '\n');
  }
}

// Run the tests
console.log('═══════════════════════════════════════════════════');
console.log('🔐 PAYSTACK PAYMENT INTEGRATION TEST');
console.log('═══════════════════════════════════════════════════\n');

testPaystackConnection()
  .then(() => {
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Test completed');
    console.log('═══════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });

