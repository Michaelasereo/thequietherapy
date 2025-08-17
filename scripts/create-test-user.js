require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
  console.log('🔧 Creating test user account...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testUserEmail = 'test-user@example.com';
  const testUserName = 'Test User';

  try {
    // Check if user already exists
    console.log('🔍 Checking if test user exists...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUserEmail)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', userCheckError);
      return;
    }

    if (existingUser) {
      console.log('✅ Test user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        user_type: existingUser.user_type,
        is_verified: existingUser.is_verified
      });
      return;
    }

    // Create new test user
    console.log('📝 Creating new test user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: testUserEmail,
        full_name: testUserName,
        user_type: 'individual',
        is_verified: true,
        is_active: true,
        credits: 5, // Give some credits for testing
        package_type: 'Basic'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      return;
    }

    console.log('✅ Test user created successfully:', {
      id: newUser.id,
      email: newUser.email,
      user_type: newUser.user_type,
      credits: newUser.credits
    });

    console.log('\n🎯 Test User Account Created:');
    console.log('Email:', testUserEmail);
    console.log('Password: N/A (Magic Link Login)');
    console.log('User Type: individual');
    console.log('Credits: 5');
    console.log('\n📝 Use this email to test the user login flow!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUser();
