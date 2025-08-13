const axios = require('axios');

async function testPaystackPayment() {
  try {
    console.log('🧪 Testing Paystack Payment Initialization...\n');

    const paymentData = {
      amount: 5000,
      email: 'test@example.com',
      reference: `test_${Date.now()}`,
      metadata: {
        type: 'session',
        sessionId: 'test-session-123'
      }
    };

    console.log('📤 Sending payment data:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post('http://localhost:3000/api/paystack/initialize', paymentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment initialization successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data.authorization_url) {
      console.log('\n🔗 Authorization URL:', response.data.data.authorization_url);
      console.log('💡 You can visit this URL to test the payment flow');
    }

  } catch (error) {
    console.error('❌ Payment initialization failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test credit purchase
async function testCreditPurchase() {
  try {
    console.log('\n🧪 Testing Credit Purchase...\n');

    const creditData = {
      amount: 50000, // Basic package
      email: 'test@example.com',
      reference: `credits_${Date.now()}`,
      metadata: {
        type: 'credits',
        credits: 10,
        packageId: 'basic',
        userId: 'test-user-123'
      }
    };

    console.log('📤 Sending credit purchase data:', JSON.stringify(creditData, null, 2));

    const response = await axios.post('http://localhost:3000/api/paystack/initialize', creditData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Credit purchase initialization successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Credit purchase failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  await testPaystackPayment();
  await testCreditPurchase();
}

runTests();
