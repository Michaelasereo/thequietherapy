require('dotenv').config({ path: '.env.local' });

async function testTherapistLogin() {
  console.log('🧪 Testing Therapist Login Flow...\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const testEmail = 'test-therapist@example.com';

  try {
    // Step 1: Test therapist login API
    console.log('1. Testing therapist login API...');
    const loginResponse = await fetch(`${baseUrl}/api/therapist/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginData);

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }

    console.log('✅ Login request successful');

    // Step 2: Check if magic link was created
    console.log('\n2. Checking for magic link in database...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (magicLinksError) {
      console.error('❌ Error checking magic links:', magicLinksError);
      return;
    }

    if (magicLinks && magicLinks.length > 0) {
      const magicLink = magicLinks[0];
      console.log('✅ Magic link found:', {
        id: magicLink.id,
        type: magicLink.type,
        used: magicLink.used_at ? 'Yes' : 'No',
        expires: magicLink.expires_at,
        metadata: magicLink.metadata
      });

      // Step 3: Test magic link verification
      console.log('\n3. Testing magic link verification...');
      const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${magicLink.token}`;
      console.log('Verification URL:', verificationUrl);

      const verifyResponse = await fetch(verificationUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects
      });

      console.log('Verification response status:', verifyResponse.status);
      console.log('Verification response headers:', Object.fromEntries(verifyResponse.headers.entries()));

      if (verifyResponse.status === 302 || verifyResponse.status === 307) {
        const location = verifyResponse.headers.get('location');
        console.log('✅ Verification successful, redirecting to:', location);
        
        if (location && location.includes('/therapist/dashboard')) {
          console.log('✅ Correctly redirected to therapist dashboard!');
        } else {
          console.log('❌ Incorrect redirect location:', location);
        }
      } else {
        console.log('❌ Verification failed or unexpected response');
      }

    } else {
      console.log('❌ No magic link found');
    }

    console.log('\n✅ Therapist login flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTherapistLogin();
