/**
 * Test Magic Link Verification Flow
 * Creates a signup, gets the token from database, then tests verification
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMagicLinkVerification() {
  console.log('\n🎯 Testing Magic Link Verification Flow\n');
  console.log('═'.repeat(70));
  
  const testEmail = `verify.test.${Date.now()}@example.com`;
  const testName = 'Verify Test';
  
  try {
    // Step 1: Create signup request
    console.log('\n📝 STEP 1: Creating Signup...\n');
    const signupResponse = await fetch('https://thequietherapy.live/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        user_type: 'individual',
        type: 'signup',
        metadata: { first_name: testName }
      }),
    });

    const signupData = await signupResponse.json();
    
    if (!signupData.success) {
      console.log('❌ Signup failed:', signupData.error);
      return false;
    }
    
    console.log('✅ Signup successful');
    
    // Step 2: Get the magic link token from database
    console.log('\n🔍 STEP 2: Getting Magic Link Token from Database...\n');
    
    const { data: magicLink, error: mlError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (mlError || !magicLink) {
      console.log('❌ Failed to get magic link from database:', mlError?.message);
      return false;
    }
    
    console.log('✅ Magic Link Found:');
    console.log(`   Email: ${magicLink.email}`);
    console.log(`   Type: ${magicLink.type}`);
    console.log(`   Auth Type: ${magicLink.auth_type}`);
    console.log(`   Token: ${magicLink.token.substring(0, 20)}...`);
    console.log(`   Expires: ${magicLink.expires_at}`);
    
    // Step 3: Test the verification URL
    console.log('\n🔗 STEP 3: Testing Verification URL...\n');
    
    const verifyUrl = `https://thequietherapy.live/api/auth/verify-magic-link?token=${magicLink.token}&auth_type=${magicLink.auth_type}`;
    console.log(`URL: ${verifyUrl.substring(0, 80)}...\n`);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    console.log(`Status: ${verifyResponse.status} ${verifyResponse.statusText}`);
    console.log(`Type: ${verifyResponse.type}`);
    
    // Check for redirect
    const location = verifyResponse.headers.get('location');
    if (location) {
      console.log(`✅ Redirect Location: ${location}`);
      
      if (location.includes('/dashboard')) {
        console.log('✅ Redirects to dashboard correctly!');
      } else if (location.includes('/login')) {
        console.log('❌ Redirects to login (ERROR!)');
        console.log('   This means verification failed');
      } else {
        console.log('⚠️  Redirects to unexpected location');
      }
    } else {
      console.log('⚠️  No redirect header found');
    }
    
    // Check for Set-Cookie header
    const setCookie = verifyResponse.headers.get('set-cookie');
    if (setCookie) {
      console.log('✅ Set-Cookie header present:');
      if (setCookie.includes('quiet_session')) {
        console.log('   ✅ quiet_session cookie being set!');
      } else {
        console.log('   ❌ No quiet_session in Set-Cookie');
      }
    } else {
      console.log('❌ NO Set-Cookie header (session not being set!)');
    }
    
    // Step 4: Check if user was created
    console.log('\n👤 STEP 4: Checking User Creation...\n');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (user) {
      console.log('✅ User Created:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Verified: ${user.is_verified}`);
      console.log(`   Active: ${user.is_active}`);
    } else {
      console.log('❌ User not found:', userError?.message);
    }
    
    // Step 5: Check if session was created
    console.log('\n🔐 STEP 5: Checking Session Creation...\n');
    
    if (user) {
      const { data: sessions, error: sessError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id);
      
      if (sessions && sessions.length > 0) {
        console.log('✅ Session Created:');
        console.log(`   Sessions: ${sessions.length}`);
        console.log(`   Latest Token: ${sessions[0].session_token.substring(0, 20)}...`);
        console.log(`   Expires: ${sessions[0].expires_at}`);
      } else {
        console.log('❌ No session found:', sessError?.message);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 DIAGNOSIS:\n');
    
    if (location && location.includes('/dashboard') && setCookie && setCookie.includes('quiet_session')) {
      console.log('✅ Everything looks good!');
      console.log('   - Redirects to dashboard ✓');
      console.log('   - Sets session cookie ✓');
      console.log('   - User created ✓\n');
      console.log('🎉 Magic link flow is working!\n');
      return true;
    } else {
      console.log('❌ Issues Found:\n');
      if (!location || !location.includes('/dashboard')) {
        console.log('   ❌ Not redirecting to dashboard');
      }
      if (!setCookie || !setCookie.includes('quiet_session')) {
        console.log('   ❌ Session cookie not being set');
      }
      console.log('\n🔧 Possible fixes:');
      console.log('   1. Run fix-magic-link-verification.sql in Supabase');
      console.log('   2. Check Netlify function logs for errors\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    return false;
  }
}

// Run the test
testMagicLinkVerification().then(success => {
  console.log('═'.repeat(70));
  if (success) {
    console.log('\n✨ TEST PASSED - Magic link verification working!\n');
  } else {
    console.log('\n⚠️  TEST REVEALED ISSUES - Check output above\n');
  }
});

