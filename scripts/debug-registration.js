require('dotenv').config({ path: '.env.local' });

async function debugRegistration() {
  console.log('🔍 Debugging Registration API...\n');

  try {
    const testData = {
      fullName: 'Debug Test User',
      email: `debug-${Date.now()}@example.com`
    };

    console.log('📤 Sending request with data:', testData);

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📥 Response body:', data);

    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed!');
      console.log('Error details:', data);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

debugRegistration();
