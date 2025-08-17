require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollmentStatus(email) {
  console.log(`🔍 Checking enrollment status for: ${email}`);
  
  try {
    // Check if user exists in users table
    console.log('\n1. Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking users table:', userError);
      return;
    }

    if (userData) {
      console.log('✅ User found in users table:');
      console.log(`   ID: ${userData.id}`);
      console.log(`   Name: ${userData.full_name}`);
      console.log(`   Type: ${userData.user_type}`);
      console.log(`   Verified: ${userData.is_verified}`);
      console.log(`   Active: ${userData.is_active}`);
    } else {
      console.log('❌ User NOT found in users table');
    }

    // Check if therapist enrollment exists
    console.log('\n2. Checking therapist_enrollments table...');
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', email)
      .single();

    if (therapistError && therapistError.code !== 'PGRST116') {
      console.error('❌ Error checking therapist_enrollments table:', therapistError);
      return;
    }

    if (therapistData) {
      console.log('✅ Therapist enrollment found:');
      console.log(`   ID: ${therapistData.id}`);
      console.log(`   Name: ${therapistData.full_name}`);
      console.log(`   Status: ${therapistData.status}`);
      console.log(`   Specialization: ${therapistData.specialization?.join(', ')}`);
      console.log(`   Languages: ${therapistData.languages?.join(', ')}`);
    } else {
      console.log('❌ Therapist enrollment NOT found');
    }

    // Check for active sessions
    console.log('\n3. Checking active sessions...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        id,
        session_token,
        expires_at,
        users!inner (
          email,
          user_type
        )
      `)
      .eq('users.email', email)
      .gt('expires_at', new Date().toISOString());

    if (sessionError) {
      console.error('❌ Error checking sessions:', sessionError);
      return;
    }

    if (sessionData && sessionData.length > 0) {
      console.log(`✅ Found ${sessionData.length} active session(s):`);
      sessionData.forEach((session, index) => {
        console.log(`   Session ${index + 1}:`);
        console.log(`     Token: ${session.session_token.substring(0, 10)}...`);
        console.log(`     Expires: ${session.expires_at}`);
        console.log(`     User Type: ${session.users.user_type}`);
      });
    } else {
      console.log('❌ No active sessions found');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    if (userData && therapistData) {
      console.log('✅ Account is fully enrolled and ready for login');
      if (sessionData && sessionData.length > 0) {
        console.log('✅ Has active session - should be able to access dashboard');
      } else {
        console.log('❌ No active session - needs to login again');
      }
    } else if (userData && !therapistData) {
      console.log('⚠️  User exists but no therapist enrollment - needs to complete enrollment');
    } else if (!userData && therapistData) {
      console.log('⚠️  Therapist enrollment exists but no user record - needs to verify email');
    } else {
      console.log('❌ Account not enrolled - needs to complete enrollment process');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'test-therapist@example.com';
checkEnrollmentStatus(email);
