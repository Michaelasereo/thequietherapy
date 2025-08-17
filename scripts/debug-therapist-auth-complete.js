require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugTherapistAuthComplete() {
  console.log('🔍 COMPREHENSIVE THERAPIST AUTH DEBUG');
  console.log('=====================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmail = 'test-therapist@example.com';

  try {
    // 1. Check environment variables
    console.log('\n1. 🔧 Environment Variables Check:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    console.log('   BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Missing');
    console.log('   BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? '✅ Set' : '❌ Missing');
    console.log('   SENDER_EMAIL:', process.env.SENDER_EMAIL ? '✅ Set' : '❌ Missing');

    // 2. Check database tables
    console.log('\n2. 🗄️ Database Tables Check:');
    const tables = ['users', 'therapist_enrollments', 'magic_links', 'user_sessions'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`   ${table}: ❌ Error - ${error.message}`);
        } else {
          console.log(`   ${table}: ✅ Accessible`);
        }
      } catch (err) {
        console.log(`   ${table}: ❌ Not accessible - ${err.message}`);
      }
    }

    // 3. Check therapist enrollment
    console.log('\n3. 👨‍⚕️ Therapist Enrollment Check:');
    const { data: therapist, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (therapistError) {
      console.log('   ❌ Therapist not found:', therapistError.message);
    } else {
      console.log('   ✅ Therapist found:', {
        id: therapist.id,
        email: therapist.email,
        status: therapist.status,
        full_name: therapist.full_name,
        is_active: therapist.is_active
      });
    }

    // 4. Check user record
    console.log('\n4. 👤 User Record Check:');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.log('   ❌ User not found:', userError.message);
    } else {
      console.log('   ✅ User found:', {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        is_verified: user.is_verified,
        is_active: user.is_active
      });
    }

    // 5. Check recent magic links
    console.log('\n5. 🔗 Recent Magic Links:');
    const { data: magicLinks, error: magicError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(3);

    if (magicError) {
      console.log('   ❌ Error fetching magic links:', magicError.message);
    } else {
      console.log(`   ✅ Found ${magicLinks.length} recent magic links:`);
      magicLinks.forEach((link, index) => {
        console.log(`      ${index + 1}. ${link.token.substring(0, 8)}... (${link.type}) - ${link.created_at}`);
        console.log(`         Used: ${link.used_at ? 'Yes' : 'No'}`);
        console.log(`         Expires: ${link.expires_at}`);
      });
    }

    // 6. Check recent sessions
    console.log('\n6. 🔐 Recent User Sessions:');
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessionError) {
      console.log('   ❌ Error fetching sessions:', sessionError.message);
    } else {
      console.log(`   ✅ Found ${sessions.length} recent sessions:`);
      sessions.forEach((session, index) => {
        console.log(`      ${index + 1}. ${session.session_token.substring(0, 8)}... - ${session.created_at}`);
        console.log(`         Expires: ${session.expires_at}`);
        console.log(`         Valid: ${new Date(session.expires_at) > new Date() ? 'Yes' : 'No'}`);
      });
    }

    // 7. Test API endpoints
    console.log('\n7. 🌐 API Endpoints Test:');
    
    // Test therapist login
    console.log('   Testing /api/therapist/login...');
    try {
      const loginResponse = await fetch('http://localhost:3000/api/therapist/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      
      const loginData = await loginResponse.json();
      console.log(`   Login response: ${loginResponse.status} - ${loginData.success ? '✅ Success' : '❌ Failed'}`);
      if (loginData.debugUrl) {
        console.log(`   Debug URL: ${loginData.debugUrl}`);
      }
    } catch (err) {
      console.log('   ❌ Login API error:', err.message);
    }

    // Test therapist me endpoint
    console.log('   Testing /api/therapist/me...');
    try {
      const meResponse = await fetch('http://localhost:3000/api/therapist/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const meData = await meResponse.json();
      console.log(`   Me response: ${meResponse.status} - ${meData.success ? '✅ Success' : '❌ Failed'}`);
      if (meData.error) {
        console.log(`   Error: ${meData.error}`);
      }
    } catch (err) {
      console.log('   ❌ Me API error:', err.message);
    }

    // 8. Check for missing columns
    console.log('\n8. 🗂️ Database Schema Check:');
    const requiredColumns = {
      'users': ['id', 'email', 'user_type', 'is_verified', 'is_active', 'last_login_at'],
      'therapist_enrollments': ['id', 'email', 'status', 'is_active'],
      'magic_links': ['id', 'email', 'token', 'type', 'expires_at', 'used_at'],
      'user_sessions': ['id', 'user_id', 'session_token', 'expires_at']
    };

    for (const [table, columns] of Object.entries(requiredColumns)) {
      console.log(`   Checking ${table} table...`);
      try {
        const { data, error } = await supabase.from(table).select(columns.join(', ')).limit(1);
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: All columns accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // 9. Summary and recommendations
    console.log('\n9. 📋 Summary & Recommendations:');
    
    if (!therapist) {
      console.log('   ❌ Therapist enrollment missing - Run enrollment first');
    }
    
    if (!user) {
      console.log('   ❌ User record missing - Check enrollment process');
    }
    
    if (magicLinks && magicLinks.length === 0) {
      console.log('   ❌ No magic links found - Check login process');
    }
    
    if (sessions && sessions.length === 0) {
      console.log('   ❌ No sessions found - Check authentication flow');
    }

    console.log('\n   🚀 Next Steps:');
    console.log('   1. Check server logs for detailed error messages');
    console.log('   2. Verify email delivery (check spam folder)');
    console.log('   3. Test magic link verification manually');
    console.log('   4. Check browser console for client-side errors');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugTherapistAuthComplete();
