const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

async function testSignupMagicLink() {
  console.log('🔗 Testing Signup Magic Link Flow...\\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frzciymslvpohhyefmtr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO'
  );

  try {
    // Step 1: Create a signup magic link
    console.log('1. Creating signup magic link...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'newuser@example.com',
        fullName: 'New User',
        userType: 'individual'
      })
    });

    const signupData = await signupResponse.json();
    console.log('   Status:', signupResponse.status);
    console.log('   Response:', signupData);

    if (!signupData.success) {
      console.log('   ❌ Signup magic link creation failed');
      return;
    }

    console.log('   ✅ Signup magic link created successfully');

    // Step 2: Get the magic link from database
    console.log('\\n2. Getting signup magic link from database...');
    const { data: magicLinks, error: fetchError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', 'newuser@example.com')
      .eq('type', 'signup')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !magicLinks || magicLinks.length === 0) {
      console.log('   ❌ No signup magic link found:', fetchError);
      return;
    }

    const magicLink = magicLinks[0];
    console.log('   ✅ Found signup magic link:', {
      id: magicLink.id,
      email: magicLink.email,
      token: magicLink.token?.substring(0, 8) + '...',
      auth_type: magicLink.auth_type,
      type: magicLink.type
    });

    // Step 3: Test verification with the signup token
    console.log('\\n3. Testing signup verification...');
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
      console.log('   ✅ Signup verification successful!');
      console.log('   User created:', verifyData.user?.email);
      console.log('   Session token:', verifyData.user?.session_token?.substring(0, 8) + '...');
      
      // Step 4: Verify user was created in database
      console.log('\\n4. Verifying user in database...');
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'newuser@example.com')
        .single();

      if (userError) {
        console.log('   ❌ User not found in database:', userError);
      } else {
        console.log('   ✅ User found in database:', {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          is_verified: user.is_verified
        });
      }
    } else {
      console.log('   ❌ Signup verification failed:', verifyData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\\n🎯 Signup Magic Link Test Complete!');
}

testSignupMagicLink().catch(console.error);
