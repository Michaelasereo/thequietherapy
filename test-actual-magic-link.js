const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

async function testActualMagicLink() {
  console.log('🔗 Testing Actual Magic Link Flow...\\n');

  // Step 1: Create a magic link and capture the token
  console.log('1. Creating magic link...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        userType: 'individual'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginData);
    
    if (loginData.success) {
      console.log('   ✅ Magic link created successfully\\n');
      
      // Step 2: Check the database for the created magic link
      console.log('2. Checking database for magic link...');
      const dbResponse = await fetch(`${BASE_URL}/api/test-magic-link-insert`, {
        method: 'GET'
      });
      
      const dbData = await dbResponse.json();
      console.log('   Status:', dbResponse.status);
      console.log('   Response:', dbData);
      
      if (dbData.success && dbData.magicLinks && dbData.magicLinks.length > 0) {
        const latestMagicLink = dbData.magicLinks[0];
        console.log('   ✅ Found magic link in database:', {
          id: latestMagicLink.id,
          email: latestMagicLink.email,
          token: latestMagicLink.token?.substring(0, 8) + '...',
          auth_type: latestMagicLink.auth_type,
          expires_at: latestMagicLink.expires_at
        });
        
        // Step 3: Test verification with the actual token
        console.log('\\n3. Testing verification with actual token...');
        const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: latestMagicLink.token,
            userType: 'individual'
          })
        });
        
        const verifyData = await verifyResponse.json();
        console.log('   Status:', verifyResponse.status);
        console.log('   Response:', verifyData);
        
        if (verifyData.success) {
          console.log('   ✅ Magic link verification successful!');
          console.log('   User:', verifyData.user?.email);
          console.log('   Session token:', verifyData.user?.session_token?.substring(0, 8) + '...');
        } else {
          console.log('   ❌ Magic link verification failed:', verifyData.error);
        }
      } else {
        console.log('   ❌ No magic links found in database');
      }
    } else {
      console.log('   ❌ Magic link creation failed');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\\n🎯 Actual Magic Link Test Complete!');
}

testActualMagicLink().catch(console.error);
