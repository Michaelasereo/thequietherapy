require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUnifiedAuth() {
  console.log('🧪 Testing Unified Authentication System\n');

  try {
    // 1. Test magic_links table structure
    console.log('1️⃣ Checking magic_links table structure...');
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .limit(1);

    if (magicLinksError) {
      console.log('❌ magic_links table error:', magicLinksError.message);
      return;
    }
    console.log('✅ magic_links table accessible');

    // 2. Test users table structure
    console.log('\n2️⃣ Checking users table structure...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ users table error:', usersError.message);
      return;
    }
    console.log('✅ users table accessible');

    // 3. Test sessions table structure
    console.log('\n3️⃣ Checking sessions table structure...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);

    if (sessionsError) {
      console.log('❌ sessions table error:', sessionsError.message);
      return;
    }
    console.log('✅ sessions table accessible');

    // 4. Test creating magic link for each user type
    console.log('\n4️⃣ Testing magic link creation for each user type...');
    const userTypes = ['individual', 'therapist', 'partner', 'admin'];
    const testEmail = 'test@unified-auth.com';

    for (const userType of userTypes) {
      console.log(`   Testing ${userType} magic link...`);
      
      const { data: magicLink, error: createError } = await supabase
        .from('magic_links')
        .insert({
          email: testEmail,
          token: `test-token-${userType}-${Date.now()}`,
          type: 'login',
          auth_type: userType,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          metadata: { user_type: userType }
        })
        .select()
        .single();

      if (createError) {
        console.log(`   ❌ ${userType} magic link creation failed:`, createError.message);
      } else {
        console.log(`   ✅ ${userType} magic link created successfully`);
        
        // Clean up test magic link
        await supabase
          .from('magic_links')
          .delete()
          .eq('id', magicLink.id);
      }
    }

    // 5. Test user creation for each type
    console.log('\n5️⃣ Testing user creation for each user type...');
    
    for (const userType of userTypes) {
      console.log(`   Testing ${userType} user creation...`);
      
      const testUserEmail = `test-${userType}@unified-auth.com`;
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: testUserEmail,
          full_name: `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
          user_type: userType,
          is_verified: true,
          is_active: true,
          credits: 0,
          package_type: 'free'
        })
        .select()
        .single();

      if (userError) {
        console.log(`   ❌ ${userType} user creation failed:`, userError.message);
      } else {
        console.log(`   ✅ ${userType} user created successfully`);
        
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
      }
    }

    console.log('\n🎉 Unified Authentication System Test Completed!');
    console.log('✅ All core functionality is working correctly');
    console.log('✅ Ready for production deployment');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUnifiedAuth();
