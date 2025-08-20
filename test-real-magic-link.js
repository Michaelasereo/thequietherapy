const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

async function testRealMagicLink() {
  console.log('🔗 Testing Real Magic Link Flow...\\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frzciymslvpohhyefmtr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO'
  );

  try {
    // Step 1: Get a real magic link from the database
    console.log('1. Getting a real magic link from database...');
    const { data: magicLinks, error: fetchError } = await supabase
      .from('magic_links')
      .select('*')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !magicLinks || magicLinks.length === 0) {
      console.log('   ❌ No unused magic links found:', fetchError);
      return;
    }

    const magicLink = magicLinks[0];
    console.log('   ✅ Found magic link:', {
      id: magicLink.id,
      email: magicLink.email,
      token: magicLink.token?.substring(0, 8) + '...',
      auth_type: magicLink.auth_type,
      type: magicLink.type,
      expires_at: magicLink.expires_at
    });

    // Step 2: Test verification with the real token
    console.log('\\n2. Testing verification with real token...');
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: magicLink.token,
        userType: magicLink.auth_type
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

    // Step 3: Test the auth verify page
    console.log('\\n3. Testing auth verify page...');
    const verifyPageUrl = `${BASE_URL}/auth/verify?token=${magicLink.token}&userType=${magicLink.auth_type}`;
    console.log('   Verify page URL:', verifyPageUrl);
    
    const pageResponse = await fetch(verifyPageUrl);
    console.log('   Page Status:', pageResponse.status);
    
    if (pageResponse.status === 200) {
      console.log('   ✅ Auth verify page accessible');
    } else {
      console.log('   ❌ Auth verify page not accessible');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\\n🎯 Real Magic Link Test Complete!');
}

testRealMagicLink().catch(console.error);
