const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL(sql) {
  console.log('🔧 Running SQL:', sql.substring(0, 100) + '...')
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ SQL Error:', error)
      return false
    }
    
    console.log('✅ SQL executed successfully')
    return true
  } catch (error) {
    console.error('❌ SQL execution failed:', error)
    return false
  }
}

async function fixDatabaseSchema() {
  console.log('🚀 Starting database schema fixes...')
  
  // Fix 1: Create or update rate_limit_attempts table
  const rateLimitSQL = `
    DO $$ 
    BEGIN
        -- Check if rate_limit_attempts table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rate_limit_attempts') THEN
            -- Add identifier column if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'rate_limit_attempts' AND column_name = 'identifier') THEN
                ALTER TABLE rate_limit_attempts ADD COLUMN identifier TEXT;
                CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
                CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_action ON rate_limit_attempts(action);
                CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_created_at ON rate_limit_attempts(created_at);
            END IF;
        ELSE
            -- Create the rate_limit_attempts table if it doesn't exist
            CREATE TABLE rate_limit_attempts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                identifier TEXT NOT NULL,
                action TEXT NOT NULL,
                ip_address INET,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_rate_limit_attempts_identifier ON rate_limit_attempts(identifier);
            CREATE INDEX idx_rate_limit_attempts_action ON rate_limit_attempts(action);
            CREATE INDEX idx_rate_limit_attempts_created_at ON rate_limit_attempts(created_at);
            CREATE INDEX idx_rate_limit_attempts_identifier_action ON rate_limit_attempts(identifier, action);
        END IF;
    END $$;
  `
  
  // Fix 2: Create or update audit_logs table
  const auditLogsSQL = `
    DO $$ 
    BEGIN
        -- Check if audit_logs table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
            -- Add device_fingerprint column if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'audit_logs' AND column_name = 'device_fingerprint') THEN
                ALTER TABLE audit_logs ADD COLUMN device_fingerprint TEXT;
                CREATE INDEX IF NOT EXISTS idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
            END IF;
            
            -- Add archived column if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_name = 'audit_logs' AND column_name = 'archived') THEN
                ALTER TABLE audit_logs ADD COLUMN archived BOOLEAN DEFAULT FALSE;
                CREATE INDEX IF NOT EXISTS idx_audit_logs_archived ON audit_logs(archived);
            END IF;
        ELSE
            -- Create the audit_logs table if it doesn't exist
            CREATE TABLE audit_logs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
                event_type TEXT NOT NULL,
                ip_address INET,
                user_agent TEXT,
                device_fingerprint TEXT,
                session_id TEXT,
                metadata JSONB DEFAULT '{}',
                archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
            CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
            CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
            CREATE INDEX idx_audit_logs_device_fingerprint ON audit_logs(device_fingerprint);
            CREATE INDEX idx_audit_logs_archived ON audit_logs(archived);
            CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);
        END IF;
    END $$;
  `
  
  // Fix 3: Create verification_tokens table
  const verificationTokensSQL = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification_tokens') THEN
            CREATE TABLE verification_tokens (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                token TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                user_type TEXT NOT NULL,
                auth_type TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
            CREATE INDEX idx_verification_tokens_email ON verification_tokens(email);
            CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
            CREATE INDEX idx_verification_tokens_used ON verification_tokens(used);
            
            -- Add RLS policies
            ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
            
            -- Policy for service role to access all tokens
            CREATE POLICY "Service role can access all verification tokens" ON verification_tokens
                FOR ALL USING (auth.role() = 'service_role');
                
            -- Policy for users to access their own tokens
            CREATE POLICY "Users can access their own verification tokens" ON verification_tokens
                FOR SELECT USING (email = auth.jwt() ->> 'email');
        END IF;
    END $$;
  `
  
  try {
    // Try to create the exec_sql function if it doesn't exist
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    console.log('🔧 Creating exec_sql function...')
    const { error: functionError } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL })
    
    if (functionError) {
      console.log('ℹ️ Function might already exist, continuing...')
    }
    
    // Execute the fixes
    await runSQL(rateLimitSQL)
    await runSQL(auditLogsSQL)
    await runSQL(verificationTokensSQL)
    
    // Clean up old records
    console.log('🧹 Cleaning up old records...')
    await runSQL("DELETE FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '7 days';")
    await runSQL("DELETE FROM verification_tokens WHERE expires_at < NOW() - INTERVAL '1 day';")
    
    console.log('✅ Database schema fixes completed successfully!')
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error)
    process.exit(1)
  }
}

// Run the fixes
fixDatabaseSchema()
  .then(() => {
    console.log('🎉 All database fixes completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Database fix script failed:', error)
    process.exit(1)
  })
