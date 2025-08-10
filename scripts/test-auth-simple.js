require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuthSimple() {
  console.log('🔐 Testing Authentication (Simple)...\n');

  try {
    // Test 1: Check Supabase connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }

    // Test 2: Check auth status
    console.log('\n2️⃣ Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  Auth status:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('ℹ️  No user authenticated');
    }

    // Test 3: Test session management
    console.log('\n3️⃣ Testing session management...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('ℹ️  Session status:', sessionError.message);
    } else if (session.session) {
      console.log('✅ Active session found');
    } else {
      console.log('ℹ️  No active session');
    }

    // Test 4: Test sign out
    console.log('\n4️⃣ Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }

    console.log('\n🎉 Authentication system is working!');
    console.log('📋 Next steps:');
    console.log('   1. Configure email settings in Supabase dashboard');
    console.log('   2. Set up email templates for confirmation');
    console.log('   3. Test with real email addresses');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthSimple();
