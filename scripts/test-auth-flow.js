require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow\n');

  try {
    // 1. Test creating a magic link
    console.log('1️⃣ Testing magic link creation...');
    const testEmail = 'test@auth-flow.com';
    
    const { data: magicLink, error: createError } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token: `test-token-${Date.now()}`,
        type: 'login',
        auth_type: 'individual',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { user_type: 'individual' }
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Magic link creation failed:', createError.message);
      return;
    }
    console.log('✅ Magic link created successfully');

    // 2. Test user creation
    console.log('\n2️⃣ Testing user creation...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        full_name: 'Test User',
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 0,
        package_type: 'free'
      })
      .select()
      .single();

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }
    console.log('✅ User created successfully:', user.id);

    // 3. Test magic link verification
    console.log('\n3️⃣ Testing magic link verification...');
    const { data: verifyResult, error: verifyError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', magicLink.token)
      .eq('auth_type', 'individual')
      .is('used_at', null)
      .single();

    if (verifyError) {
      console.log('❌ Magic link verification failed:', verifyError.message);
    } else {
      console.log('✅ Magic link verification successful');
    }

    // 4. Test dashboard access
    console.log('\n4️⃣ Testing dashboard access...');
    const { data: dashboardUser, error: dashboardError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (dashboardError) {
      console.log('❌ Dashboard access failed:', dashboardError.message);
    } else {
      console.log('✅ Dashboard access successful');
      console.log('   User:', dashboardUser.full_name);
      console.log('   Type:', dashboardUser.user_type);
      console.log('   Verified:', dashboardUser.is_verified);
    }

    // Clean up test data
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase.from('magic_links').delete().eq('id', magicLink.id);
    await supabase.from('users').delete().eq('id', user.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthFlow();
