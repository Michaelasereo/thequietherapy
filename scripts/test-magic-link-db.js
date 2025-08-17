const { createClient } = require('@supabase/supabase-js');

async function testMagicLinkDatabase() {
  console.log('🔍 Testing Magic Link Database Setup...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Variables:');
  console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('- SUPABASE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables. Please check your .env file.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check if magic_links table exists
    console.log('\n📋 Test 1: Checking magic_links table...');
    
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .limit(1);
    
    if (magicLinksError) {
      console.log('❌ magic_links table error:', magicLinksError.message);
      console.log('This might mean the table doesn\'t exist or has wrong permissions.');
    } else {
      console.log('✅ magic_links table exists and is accessible');
      console.log('Current magic links count:', magicLinks?.length || 0);
    }
    
    // Test 2: Check if users table exists
    console.log('\n👥 Test 2: Checking users table...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users table error:', usersError.message);
    } else {
      console.log('✅ users table exists and is accessible');
      console.log('Current users count:', users?.length || 0);
    }
    
    // Test 3: Check if user_sessions table exists
    console.log('\n🔐 Test 3: Checking user_sessions table...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.log('❌ user_sessions table error:', sessionsError.message);
    } else {
      console.log('✅ user_sessions table exists and is accessible');
      console.log('Current sessions count:', sessions?.length || 0);
    }
    
    // Test 4: Try to create a test magic link
    console.log('\n🧪 Test 4: Testing magic link creation...');
    
    const testToken = 'test-token-' + Date.now();
    const testEmail = 'test@example.com';
    
    const { data: insertData, error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token: testToken,
        type: 'signup',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { test: true }
      })
      .select();
    
    if (insertError) {
      console.log('❌ Failed to create test magic link:', insertError.message);
    } else {
      console.log('✅ Successfully created test magic link');
      
      // Clean up - delete the test record
      await supabase
        .from('magic_links')
        .delete()
        .eq('token', testToken);
      
      console.log('✅ Test magic link cleaned up');
    }
    
    console.log('\n📊 Database Test Summary:');
    console.log('- magic_links table:', magicLinksError ? '❌ FAILED' : '✅ OK');
    console.log('- users table:', usersError ? '❌ FAILED' : '✅ OK');
    console.log('- user_sessions table:', sessionsError ? '❌ FAILED' : '✅ OK');
    console.log('- magic link creation:', insertError ? '❌ FAILED' : '✅ OK');
    
    if (magicLinksError || usersError || sessionsError || insertError) {
      console.log('\n🚨 Issues found! Please check your database setup.');
      console.log('Make sure all required tables exist and have proper permissions.');
    } else {
      console.log('\n✅ All database tests passed!');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run the test
testMagicLinkDatabase().catch(console.error);
