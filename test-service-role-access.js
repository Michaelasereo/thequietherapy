const { createClient } = require('@supabase/supabase-js');

// Test service role access
async function testServiceRoleAccess() {
  console.log('🔑 Testing Service Role Access...\\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frzciymslvpohhyefmtr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_IUgjaZMUy-Il7waL-hMmiw_awYJ2AyO'
  );

  try {
    // Test 1: Check if we can read from magic_links
    console.log('1. Testing read access to magic_links...');
    const { data: readData, error: readError } = await supabase
      .from('magic_links')
      .select('*')
      .limit(5);

    if (readError) {
      console.log('   ❌ Read access failed:', readError);
    } else {
      console.log('   ✅ Read access successful, found', readData?.length || 0, 'records');
    }

    // Test 2: Try to insert a magic link
    console.log('\\n2. Testing insert access to magic_links...');
    const testToken = 'test-service-role-' + Date.now();
    const testEmail = 'test-service@example.com';
    
    const { data: insertData, error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email: testEmail,
        token: testToken,
        type: 'login',
        auth_type: 'individual',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: { test: true, service_role_test: true }
      })
      .select();

    if (insertError) {
      console.log('   ❌ Insert access failed:', insertError);
    } else {
      console.log('   ✅ Insert access successful:', insertData);
      
      // Test 3: Try to update the magic link
      console.log('\\n3. Testing update access to magic_links...');
      const { data: updateData, error: updateError } = await supabase
        .from('magic_links')
        .update({ metadata: { test: true, updated: true } })
        .eq('token', testToken)
        .select();

      if (updateError) {
        console.log('   ❌ Update access failed:', updateError);
      } else {
        console.log('   ✅ Update access successful:', updateData);
      }

      // Test 4: Try to delete the magic link
      console.log('\\n4. Testing delete access to magic_links...');
      const { error: deleteError } = await supabase
        .from('magic_links')
        .delete()
        .eq('token', testToken);

      if (deleteError) {
        console.log('   ❌ Delete access failed:', deleteError);
      } else {
        console.log('   ✅ Delete access successful');
      }
    }

    // Test 5: Check RLS status
    console.log('\\n5. Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'magic_links' });

    if (rlsError) {
      console.log('   ⚠️ Could not check RLS status:', rlsError);
    } else {
      console.log('   ✅ RLS status:', rlsData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\\n🎯 Service Role Access Test Complete!');
}

testServiceRoleAccess().catch(console.error);
