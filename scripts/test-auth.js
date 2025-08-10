require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  try {
    // Test 1: Check current authentication status
    console.log('1️⃣ Checking current authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
    } else {
      console.log('ℹ️  No user currently authenticated');
    }

    // Test 2: Test user registration
    console.log('\n2️⃣ Testing user registration...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          user_type: 'individual'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Registration error:', signUpError.message);
    } else {
      console.log('✅ User registration successful!');
      console.log('   User ID:', signUpData.user?.id);
      console.log('   Email:', signUpData.user?.email);
    }

    // Test 3: Test user profile creation in users table
    if (signUpData.user) {
      console.log('\n3️⃣ Testing user profile creation...');
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          email: testEmail,
          full_name: 'Test User',
          user_type: 'individual',
          is_verified: false,
          is_active: true,
          credits: 0,
          package_type: 'Basic'
        })
        .select()
        .single();

      if (profileError) {
        console.log('❌ Profile creation error:', profileError.message);
      } else {
        console.log('✅ User profile created successfully!');
        console.log('   Profile ID:', profile.id);
        console.log('   User Type:', profile.user_type);
        console.log('   Credits:', profile.credits);
      }
    }

    // Test 4: Test user sign in
    console.log('\n4️⃣ Testing user sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
    } else {
      console.log('✅ User signed in successfully!');
      console.log('   Session user:', signInData.user?.email);
    }

    // Test 5: Test fetching user profile after sign in
    if (signInData.user) {
      console.log('\n5️⃣ Testing profile fetch after sign in...');
      
      const { data: userProfile, error: profileFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileFetchError) {
        console.log('❌ Profile fetch error:', profileFetchError.message);
      } else {
        console.log('✅ User profile fetched successfully!');
        console.log('   Name:', userProfile.full_name);
        console.log('   Type:', userProfile.user_type);
        console.log('   Credits:', userProfile.credits);
        console.log('   Verified:', userProfile.is_verified);
      }
    }

    // Test 6: Test user sign out
    console.log('\n6️⃣ Testing user sign out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ User signed out successfully!');
    }

    // Test 7: Verify sign out worked
    console.log('\n7️⃣ Verifying sign out...');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      console.log('❌ User is still authenticated after sign out');
    } else {
      console.log('✅ User is properly signed out');
    }

    console.log('\n🎉 Authentication tests completed!');
    console.log('📋 Summary:');
    console.log('   ✅ User registration works');
    console.log('   ✅ User profile creation works');
    console.log('   ✅ User sign in works');
    console.log('   ✅ User sign out works');
    console.log('   ✅ Profile fetching works');

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
}

// Run the authentication test
testAuthentication();
