require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestSession() {
  console.log('🔐 Creating test session for development...\n');

  try {
    // Get the user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'asereope@gmail.com')
      .single();

    if (userError) {
      console.log('❌ User not found:', userError.message);
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('   ID:', user.id);
    console.log('   Type:', user.user_type);
    console.log('   Verified:', user.is_verified);

    // Create a test session token
    const sessionToken = `test-session-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: 'Test Session',
        ip_address: '127.0.0.1'
      });

    if (sessionError) {
      console.log('❌ Error creating session:', sessionError);
      return;
    }

    console.log('✅ Test session created successfully!');
    console.log('   Session Token:', sessionToken);
    console.log('   Expires:', expiresAt.toLocaleString());

    // Create session data for cookie
    const sessionData = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type,
      isVerified: user.is_verified,
      credits: user.credits,
      packageType: user.package_type,
      sessionToken: sessionToken
    };

    console.log('\n📋 Session Data for Cookie:');
    console.log(JSON.stringify(sessionData, null, 2));

    console.log('\n🔧 To use this session:');
    console.log('1. Open browser developer tools');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Find Cookies for localhost:3001');
    console.log('4. Add cookie: trpi_user_session');
    console.log('5. Value:', sessionToken);
    console.log('6. Expires:', expiresAt.toISOString());

    console.log('\n💡 Or use this JavaScript in browser console:');
    console.log(`document.cookie = "trpi_user_session=${sessionToken}; expires=${expiresAt.toUTCString()}; path=/";`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestSession();
