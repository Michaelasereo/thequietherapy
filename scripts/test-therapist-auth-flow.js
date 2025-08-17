require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTherapistAuthFlow() {
  console.log('🧪 Testing Therapist Authentication Flow...\n');

  try {
    // Step 1: Check if test therapist exists
    console.log('1. Checking for test therapist...');
    const { data: existingTherapist, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', 'test-therapist@example.com')
      .single();

    if (therapistError && therapistError.code !== 'PGRST116') {
      console.error('❌ Error checking therapist:', therapistError);
      return;
    }

    if (existingTherapist) {
      console.log('✅ Test therapist found:', existingTherapist.email);
    } else {
      console.log('❌ Test therapist not found');
      return;
    }

    // Step 2: Check if user record exists
    console.log('\n2. Checking for user record...');
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test-therapist@example.com')
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', userError);
      return;
    }

    if (existingUser) {
      console.log('✅ User record found:', {
        id: existingUser.id,
        email: existingUser.email,
        user_type: existingUser.user_type,
        is_verified: existingUser.is_verified,
        is_active: existingUser.is_active
      });
    } else {
      console.log('❌ User record not found');
      return;
    }

    // Step 3: Check for existing sessions
    console.log('\n3. Checking for existing sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', existingUser.id);

    if (sessionsError) {
      console.error('❌ Error checking sessions:', sessionsError);
      return;
    }

    if (sessions && sessions.length > 0) {
      console.log('✅ Found existing sessions:', sessions.length);
      sessions.forEach(session => {
        console.log(`   - Session ID: ${session.id}, Expires: ${session.expires_at}`);
      });
    } else {
      console.log('ℹ️  No existing sessions found');
    }

    // Step 4: Check for magic links
    console.log('\n4. Checking for magic links...');
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', 'test-therapist@example.com')
      .order('created_at', { ascending: false })
      .limit(5);

    if (magicLinksError) {
      console.error('❌ Error checking magic links:', magicLinksError);
      return;
    }

    if (magicLinks && magicLinks.length > 0) {
      console.log('✅ Found magic links:', magicLinks.length);
      magicLinks.forEach(link => {
        console.log(`   - Type: ${link.type}, Used: ${link.used_at ? 'Yes' : 'No'}, Expires: ${link.expires_at}`);
        console.log(`     Metadata:`, link.metadata);
      });
    } else {
      console.log('ℹ️  No magic links found');
    }

    console.log('\n✅ Therapist authentication flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Therapist enrollment: ${existingTherapist ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - User record: ${existingUser ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - User type: ${existingUser?.user_type || 'N/A'}`);
    console.log(`   - User verified: ${existingUser?.is_verified || false}`);
    console.log(`   - User active: ${existingUser?.is_active || false}`);
    console.log(`   - Sessions: ${sessions?.length || 0}`);
    console.log(`   - Magic links: ${magicLinks?.length || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTherapistAuthFlow();
