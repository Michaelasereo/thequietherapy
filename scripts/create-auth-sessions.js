require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAuthSessionsTable() {
  console.log('🔧 Creating auth_sessions table...');

  try {
    // Create auth_sessions table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          session_token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          user_agent TEXT,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('❌ Error creating auth_sessions table:', createError.message);
      return;
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
      `
    });

    if (indexError) {
      console.log('❌ Error creating indexes:', indexError.message);
      return;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.log('❌ Error enabling RLS:', rlsError.message);
      return;
    }

    // Create policy
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Service role can manage auth sessions" ON auth_sessions
        FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (policyError) {
      console.log('❌ Error creating policy:', policyError.message);
      return;
    }

    console.log('✅ auth_sessions table created successfully!');
    console.log('✅ Indexes created successfully!');
    console.log('✅ RLS enabled successfully!');
    console.log('✅ Policy created successfully!');

    // Test the table
    const { data, error: testError } = await supabase
      .from('auth_sessions')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Error testing auth_sessions table:', testError.message);
    } else {
      console.log('✅ auth_sessions table is accessible and working!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createAuthSessionsTable();
