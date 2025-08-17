require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkTestAccounts() {
  console.log('🔍 CHECKING TEST ACCOUNTS');
  console.log('========================');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmails = [
    'test-therapist@example.com',
    'test-user@example.com'
  ];

  try {
    for (const email of testEmails) {
      console.log(`\n📧 Checking: ${email}`);
      
      // Check users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.log('❌ Error checking user:', userError.message);
        continue;
      }

      if (user) {
        console.log('✅ User Account:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Type: ${user.user_type}`);
        console.log(`   Verified: ${user.is_verified}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Credits: ${user.credits || 'N/A'}`);
        console.log(`   Created: ${user.created_at}`);
      } else {
        console.log('❌ No user account found');
      }

      // Check therapist_enrollments table
      const { data: therapist, error: therapistError } = await supabase
        .from('therapist_enrollments')
        .select('*')
        .eq('email', email)
        .single();

      if (therapistError && therapistError.code !== 'PGRST116') {
        console.log('❌ Error checking therapist:', therapistError.message);
        continue;
      }

      if (therapist) {
        console.log('✅ Therapist Account:');
        console.log(`   ID: ${therapist.id}`);
        console.log(`   Status: ${therapist.status}`);
        console.log(`   Active: ${therapist.is_active}`);
        console.log(`   Rate: ₦${therapist.hourly_rate}`);
        console.log(`   Created: ${therapist.created_at}`);
      } else {
        console.log('❌ No therapist account found');
      }

      // Check recent sessions
      if (user) {
        const { data: sessions, error: sessionError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!sessionError && sessions && sessions.length > 0) {
          console.log('✅ Recent Sessions:');
          sessions.forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.session_token.substring(0, 8)}... - ${session.created_at}`);
          });
        }
      }
    }

    console.log('\n🎯 TESTING GUIDE:');
    console.log('================');
    console.log('1. Therapist Login:');
    console.log('   - Email: test-therapist@example.com');
    console.log('   - Go to: http://localhost:3000/therapist/login');
    console.log('   - Redirects to: /therapist/dashboard');
    console.log('');
    console.log('2. User Login:');
    console.log('   - Email: test-user@example.com');
    console.log('   - Go to: http://localhost:3000/login');
    console.log('   - Redirects to: /dashboard');
    console.log('');
    console.log('3. Testing Session Booking:');
    console.log('   - Login as user first');
    console.log('   - Then try to book a session with the therapist');
    console.log('   - Use separate browsers/incognito for different accounts');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTestAccounts();
