require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRegistration() {
  console.log('🔐 Testing Registration API...\n');

  try {
    // Test 1: Check if magic_links table exists
    console.log('1️⃣ Checking if magic_links table exists...');
    const { data: magicLinksData, error: magicLinksError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .limit(1);
    
    if (magicLinksError) {
      console.log('❌ Magic links table error:', magicLinksError.message);
      console.log('💡 You may need to run the create-auth-tables.sql script');
    } else {
      console.log('✅ Magic links table exists!');
    }

    // Test 2: Check if users table exists
    console.log('\n2️⃣ Checking if users table exists...');
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table exists!');
    }

    // Test 3: Test registration API
    console.log('\n3️⃣ Testing registration API...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testFullName = 'Test User';
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: testFullName,
        email: testEmail,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration API successful!');
      console.log('📧 Response:', data);
    } else {
      console.log('❌ Registration API failed:', data.error);
    }

    // Test 4: Check if user was created
    console.log('\n4️⃣ Checking if user was created...');
    const { data: newUser, error: newUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (newUserError) {
      console.log('❌ User lookup error:', newUserError.message);
    } else if (newUser) {
      console.log('✅ User created successfully!');
      console.log('👤 User details:', {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        user_type: newUser.user_type,
        is_verified: newUser.is_verified
      });
    } else {
      console.log('❌ User not found');
    }

    // Test 5: Check if magic link was created
    console.log('\n5️⃣ Checking if magic link was created...');
    const { data: magicLink, error: magicLinkError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .eq('type', 'signup')
      .single();
    
    if (magicLinkError) {
      console.log('❌ Magic link lookup error:', magicLinkError.message);
    } else if (magicLink) {
      console.log('✅ Magic link created successfully!');
      console.log('🔗 Magic link details:', {
        token: magicLink.token.substring(0, 20) + '...',
        type: magicLink.type,
        expires_at: magicLink.expires_at,
        used_at: magicLink.used_at
      });
    } else {
      console.log('❌ Magic link not found');
    }

    console.log('\n🎉 Registration test completed!');
    console.log('📋 Next steps:');
    console.log('   1. Check your email for the magic link');
    console.log('   2. Test the magic link verification');
    console.log('   3. Verify user can log in after clicking the link');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRegistration();
