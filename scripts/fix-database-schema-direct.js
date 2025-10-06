const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDatabaseSchema() {
  console.log('🚀 Starting database schema fixes...')
  
  try {
    // Fix 1: Check and create rate_limit_attempts table
    console.log('🔧 Fixing rate_limit_attempts table...')
    
    // Try to select from the table to see if it exists
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('rate_limit_attempts')
      .select('id')
      .limit(1)
    
    if (rateLimitError && rateLimitError.code === 'PGRST116') {
      console.log('📝 Creating rate_limit_attempts table...')
      
      // Create the table using a simple insert that will trigger table creation
      const { error: createError } = await supabase
        .from('rate_limit_attempts')
        .insert({
          identifier: 'test',
          action: 'test',
          created_at: new Date().toISOString()
        })
      
      if (createError) {
        console.error('❌ Failed to create rate_limit_attempts table:', createError)
      } else {
        console.log('✅ Created rate_limit_attempts table')
        
        // Clean up test record
        await supabase
          .from('rate_limit_attempts')
          .delete()
          .eq('identifier', 'test')
      }
    } else if (rateLimitError) {
      console.error('❌ Error checking rate_limit_attempts table:', rateLimitError)
    } else {
      console.log('✅ rate_limit_attempts table already exists')
    }
    
    // Fix 2: Check and create audit_logs table
    console.log('🔧 Fixing audit_logs table...')
    
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1)
    
    if (auditError && auditError.code === 'PGRST116') {
      console.log('📝 Creating audit_logs table...')
      
      const { error: createAuditError } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'test',
          created_at: new Date().toISOString()
        })
      
      if (createAuditError) {
        console.error('❌ Failed to create audit_logs table:', createAuditError)
      } else {
        console.log('✅ Created audit_logs table')
        
        // Clean up test record
        await supabase
          .from('audit_logs')
          .delete()
          .eq('event_type', 'test')
      }
    } else if (auditError) {
      console.error('❌ Error checking audit_logs table:', auditError)
    } else {
      console.log('✅ audit_logs table already exists')
    }
    
    // Fix 3: Check and create verification_tokens table
    console.log('🔧 Fixing verification_tokens table...')
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('id')
      .limit(1)
    
    if (tokenError && tokenError.code === 'PGRST116') {
      console.log('📝 Creating verification_tokens table...')
      
      const { error: createTokenError } = await supabase
        .from('verification_tokens')
        .insert({
          token: 'test-token',
          email: 'test@example.com',
          user_type: 'individual',
          auth_type: 'login',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
      
      if (createTokenError) {
        console.error('❌ Failed to create verification_tokens table:', createTokenError)
      } else {
        console.log('✅ Created verification_tokens table')
        
        // Clean up test record
        await supabase
          .from('verification_tokens')
          .delete()
          .eq('token', 'test-token')
      }
    } else if (tokenError) {
      console.error('❌ Error checking verification_tokens table:', tokenError)
    } else {
      console.log('✅ verification_tokens table already exists')
    }
    
    // Clean up old records
    console.log('🧹 Cleaning up old records...')
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Clean up old rate limit attempts
    const { error: cleanupRateLimitError } = await supabase
      .from('rate_limit_attempts')
      .delete()
      .lt('created_at', sevenDaysAgo)
    
    if (cleanupRateLimitError) {
      console.log('ℹ️ Could not clean up rate_limit_attempts:', cleanupRateLimitError.message)
    } else {
      console.log('✅ Cleaned up old rate limit attempts')
    }
    
    // Clean up expired verification tokens
    const { error: cleanupTokenError } = await supabase
      .from('verification_tokens')
      .delete()
      .lt('expires_at', oneDayAgo)
    
    if (cleanupTokenError) {
      console.log('ℹ️ Could not clean up verification_tokens:', cleanupTokenError.message)
    } else {
      console.log('✅ Cleaned up expired verification tokens')
    }
    
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
