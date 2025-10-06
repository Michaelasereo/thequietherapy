// Migrate existing therapist to new unified session system
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { SignJWT } = require('jose');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function migrateTherapistToUnifiedSession() {
  try {
    console.log('🔄 Migrating therapist to unified session system...');
    
    // Get the therapist user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'michaelasereo@gmail.com')
      .eq('user_type', 'therapist')
      .single();
    
    if (userError || !user) {
      console.error('❌ Error finding therapist user:', userError);
      return;
    }
    
    console.log('✅ Found therapist user:', user.email);
    
    // Create a new session token
    const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create JWT token for the new session system
    const jwtToken = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: 'therapist',
      user_type: user.user_type,
      is_verified: user.is_verified,
      is_active: user.is_active,
      session_token: sessionToken
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    
    console.log('✅ Created JWT token for unified session');
    console.log('🍪 JWT Token (first 50 chars):', jwtToken.substring(0, 50) + '...');
    
    // Create session record in database
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (sessionError) {
      console.error('❌ Error creating session record:', sessionError);
      return;
    }
    
    console.log('✅ Created session record in database');
    
    console.log('');
    console.log('🎉 Migration complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Clear your browser cookies completely');
    console.log('2. Go to: http://localhost:3000/therapist/login');
    console.log('3. Request a new magic link');
    console.log('4. The new system will create a unified trpi_session cookie');
    console.log('5. No more authentication issues!');
    console.log('');
    console.log('🔑 Your new session token:', sessionToken);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

migrateTherapistToUnifiedSession();
