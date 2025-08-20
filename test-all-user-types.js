const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';

async function testAllUserTypes() {
  console.log('🧪 Testing All User Types Authentication...\\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frzciymslvpohhyefmtr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO'
  );

  const userTypes = [
    { type: 'individual', email: 'test-individual@example.com', name: 'Test Individual' },
    { type: 'therapist', email: 'test-therapist@example.com', name: 'Test Therapist' },
    { type: 'partner', email: 'test-partner@example.com', name: 'Test Partner' },
    { type: 'admin', email: 'michaelasereoo@gmail.com', name: 'Test Admin' }
  ];

  for (const userType of userTypes) {
    console.log(`\\n🔐 Testing ${userType.type.toUpperCase()} User Type...`);
    console.log('='.repeat(50));

    // Step 1: Test Signup
    console.log(`\\n1. Testing ${userType.type} signup...`);
    try {
      const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userType.email,
          fullName: userType.name,
          userType: userType.type
        })
      });

      const signupData = await signupResponse.json();
      console.log('   Status:', signupResponse.status);
      console.log('   Response:', signupData);

      if (!signupData.success) {
        console.log(`   ❌ ${userType.type} signup failed`);
        continue;
      }

      console.log(`   ✅ ${userType.type} signup successful`);

      // Step 2: Get the magic link from database
      console.log(`\\n2. Getting ${userType.type} magic link from database...`);
      const { data: magicLinks, error: fetchError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('email', userType.email)
        .eq('type', 'signup')
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !magicLinks || magicLinks.length === 0) {
        console.log(`   ❌ No ${userType.type} magic link found:`, fetchError);
        continue;
      }

      const magicLink = magicLinks[0];
      console.log(`   ✅ Found ${userType.type} magic link:`, {
        id: magicLink.id,
        email: magicLink.email,
        token: magicLink.token?.substring(0, 8) + '...',
        auth_type: magicLink.auth_type,
        type: magicLink.type
      });

      // Step 3: Test magic link verification
      console.log(`\\n3. Testing ${userType.type} magic link verification...`);
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
        console.log(`   ✅ ${userType.type} verification successful!`);
        console.log('   User created:', verifyData.user?.email);
        console.log('   Session token:', verifyData.user?.session_token?.substring(0, 8) + '...');
        
        // Step 4: Verify user in database
        console.log(`\\n4. Verifying ${userType.type} user in database...`);
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userType.email)
          .single();

        if (userError) {
          console.log(`   ❌ ${userType.type} user not found in database:`, userError);
        } else {
          console.log(`   ✅ ${userType.type} user found in database:`, {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            is_verified: user.is_verified
          });
        }
      } else {
        console.log(`   ❌ ${userType.type} verification failed:`, verifyData.error);
      }

    } catch (error) {
      console.log(`   ❌ ${userType.type} test failed:`, error.message);
    }
  }

  // Test Login for existing users
  console.log(`\\n\\n🔑 Testing Login for All User Types...`);
  console.log('='.repeat(50));

  for (const userType of userTypes) {
    console.log(`\\n🔐 Testing ${userType.type.toUpperCase()} Login...`);

    try {
      // Step 1: Test Login
      console.log(`\\n1. Testing ${userType.type} login...`);
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userType.email,
          userType: userType.type
        })
      });

      const loginData = await loginResponse.json();
      console.log('   Status:', loginResponse.status);
      console.log('   Response:', loginData);

      if (!loginData.success) {
        console.log(`   ❌ ${userType.type} login failed`);
        continue;
      }

      console.log(`   ✅ ${userType.type} login successful`);

      // Step 2: Get the login magic link from database
      console.log(`\\n2. Getting ${userType.type} login magic link...`);
      const { data: loginMagicLinks, error: loginFetchError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('email', userType.email)
        .eq('type', 'login')
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (loginFetchError || !loginMagicLinks || loginMagicLinks.length === 0) {
        console.log(`   ❌ No ${userType.type} login magic link found:`, loginFetchError);
        continue;
      }

      const loginMagicLink = loginMagicLinks[0];
      console.log(`   ✅ Found ${userType.type} login magic link:`, {
        id: loginMagicLink.id,
        email: loginMagicLink.email,
        token: loginMagicLink.token?.substring(0, 8) + '...',
        auth_type: loginMagicLink.auth_type,
        type: loginMagicLink.type
      });

      // Step 3: Test login magic link verification
      console.log(`\\n3. Testing ${userType.type} login verification...`);
      const loginVerifyResponse = await fetch(`${BASE_URL}/api/auth/verify-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: loginMagicLink.token,
          userType: loginMagicLink.auth_type
        })
      });

      const loginVerifyData = await loginVerifyResponse.json();
      console.log('   Status:', loginVerifyResponse.status);
      console.log('   Response:', loginVerifyData);

      if (loginVerifyData.success) {
        console.log(`   ✅ ${userType.type} login verification successful!`);
        console.log('   User logged in:', loginVerifyData.user?.email);
        console.log('   Session token:', loginVerifyData.user?.session_token?.substring(0, 8) + '...');
      } else {
        console.log(`   ❌ ${userType.type} login verification failed:`, loginVerifyData.error);
      }

    } catch (error) {
      console.log(`   ❌ ${userType.type} login test failed:`, error.message);
    }
  }

  console.log('\\n🎯 All User Types Test Complete!');
}

testAllUserTypes().catch(console.error);
