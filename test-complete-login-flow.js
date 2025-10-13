/**
 * Test Complete Login Flow with Cookie Handling
 * Simulates browser behavior to test magic link → dashboard flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteLoginFlow() {
  console.log('\n🧪 Testing Complete Login Flow\n');
  console.log('═'.repeat(70));
  
  const testEmail = `login.test.${Date.now()}@example.com`;
  
  try {
    // Step 1: Create a test user directly in database
    console.log('\n👤 STEP 1: Creating Test User...\n');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Login Test User',
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 5
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Failed to create user:', userError.message);
      return;
    }
    
    console.log('✅ User created:', user.id);
    
    // Step 2: Request magic link (login, not signup)
    console.log('\n📧 STEP 2: Requesting Magic Link (Login)...\n');
    
    const loginResponse = await fetch('https://thequietherapy.live/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        user_type: 'individual',
        type: 'login'
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Response:`, loginData);
    
    if (!loginData.success) {
      console.log('❌ Login request failed');
      return;
    }
    
    console.log('✅ Magic link sent');
    
    // Step 3: Get the magic link token from database
    console.log('\n🔍 STEP 3: Getting Magic Link Token...\n');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const { data: magicLink } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .eq('type', 'login')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!magicLink) {
      console.log('❌ Magic link not found in database');
      return;
    }
    
    console.log('✅ Magic link found');
    console.log(`   Token: ${magicLink.token.substring(0, 20)}...`);
    console.log(`   Auth Type: ${magicLink.auth_type}`);
    
    // Step 4: Test the verification endpoint with cookie tracking
    console.log('\n🔗 STEP 4: Testing Magic Link Verification...\n');
    
    const verifyUrl = `https://thequietherapy.live/api/auth/verify-magic-link?token=${magicLink.token}&auth_type=${magicLink.auth_type}`;
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects
      headers: {
        'User-Agent': 'TestBot/1.0'
      }
    });
    
    console.log(`Status: ${verifyResponse.status} ${verifyResponse.statusText}`);
    
    const location = verifyResponse.headers.get('location');
    const setCookie = verifyResponse.headers.get('set-cookie');
    
    console.log(`\nRedirect Location: ${location || 'NONE!'}`);
    console.log(`Set-Cookie: ${setCookie ? 'YES' : 'NO'}`);
    
    if (setCookie) {
      console.log(`\nCookie Details:`);
      const cookieParts = setCookie.split(';');
      cookieParts.forEach(part => {
        console.log(`   ${part.trim()}`);
      });
      
      if (setCookie.includes('quiet_session')) {
        console.log('\n✅ quiet_session cookie is being set!');
      } else {
        console.log('\n❌ quiet_session cookie NOT in Set-Cookie header');
      }
    } else {
      console.log('\n❌ NO Set-Cookie header - session not being set!');
    }
    
    if (location) {
      if (location.includes('/dashboard')) {
        console.log('\n✅ Redirects to dashboard!');
      } else if (location.includes('/login')) {
        console.log('\n❌ Redirects to login (PROBLEM!)');
        console.log('   Check Netlify function logs for errors');
      } else {
        console.log('\n⚠️  Redirects to:', location);
      }
    } else {
      console.log('\n❌ NO redirect location - verification endpoint might be broken');
    }
    
    // Step 5: Check if user session was created in database
    console.log('\n🔐 STEP 5: Checking Session in Database...\n');
    
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id);
    
    if (sessions && sessions.length > 0) {
      console.log('✅ Session created in database');
      console.log(`   Token: ${sessions[0].session_token.substring(0, 20)}...`);
      console.log(`   Expires: ${sessions[0].expires_at}`);
    } else {
      console.log('❌ NO session in database');
      console.log('   This is why the cookie check fails!');
    }
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 DIAGNOSIS:\n');
    
    const hasRedirect = location && location.includes('/dashboard');
    const hasCookie = setCookie && setCookie.includes('quiet_session');
    const hasDbSession = sessions && sessions.length > 0;
    
    if (hasRedirect && hasCookie && hasDbSession) {
      console.log('✅ ALL CHECKS PASSED');
      console.log('   - Redirects to dashboard ✓');
      console.log('   - Sets session cookie ✓');
      console.log('   - Creates database session ✓\n');
      console.log('🎉 Login flow is working!\n');
    } else {
      console.log('❌ ISSUES FOUND:\n');
      if (!hasRedirect) console.log('   ❌ Not redirecting to dashboard');
      if (!hasCookie) console.log('   ❌ Session cookie not being set');
      if (!hasDbSession) console.log('   ❌ Session not saved in database');
      
      console.log('\n💡 MOST LIKELY CAUSE:');
      console.log('   Database function "create_or_get_user" or "create_user_session" missing\n');
      console.log('🔧 FIX:');
      console.log('   Run: fix-magic-link-verification.sql in Supabase\n');
    }
    
    // Check Netlify logs hint
    console.log('📞 Check Netlify logs for detailed errors:');
    console.log('https://app.netlify.com/projects/thequietherapy/logs/functions\n');
    
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
  }
}

testCompleteLoginFlow();

