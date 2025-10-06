const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMissingColumns() {
  console.log('🚀 Fixing missing database columns...')
  
  try {
    // Fix 1: Add missing columns to rate_limit_attempts table
    console.log('🔧 Adding missing columns to rate_limit_attempts table...')
    
    // First, let's see what columns exist
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .limit(1)
    
    if (rateLimitError) {
      console.error('❌ Error checking rate_limit_attempts table:', rateLimitError)
    } else {
      console.log('📋 Current rate_limit_attempts columns:', Object.keys(rateLimitData?.[0] || {}))
      
      // Try to insert a record with the missing columns to trigger column creation
      const testRecord = {
        identifier: 'test-column-check',
        action: 'test_action',
        created_at: new Date().toISOString()
      }
      
      const { error: insertError } = await supabase
        .from('rate_limit_attempts')
        .insert(testRecord)
      
      if (insertError) {
        console.log('ℹ️ Insert error (expected if columns missing):', insertError.message)
        
        // If the error is about missing columns, we need to create them manually
        if (insertError.message.includes('identifier') || insertError.message.includes('action')) {
          console.log('📝 Columns are missing, but we cannot create them via client')
          console.log('💡 Please run the SQL fixes manually in your Supabase dashboard:')
          console.log('   1. Go to your Supabase project dashboard')
          console.log('   2. Navigate to SQL Editor')
          console.log('   3. Run the contents of fix-rate-limit-table-columns.sql')
        }
      } else {
        console.log('✅ rate_limit_attempts table has required columns')
        
        // Clean up test record
        await supabase
          .from('rate_limit_attempts')
          .delete()
          .eq('identifier', 'test-column-check')
      }
    }
    
    // Fix 2: Add missing columns to audit_logs table
    console.log('🔧 Adding missing columns to audit_logs table...')
    
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1)
    
    if (auditError) {
      console.error('❌ Error checking audit_logs table:', auditError)
    } else {
      console.log('📋 Current audit_logs columns:', Object.keys(auditData?.[0] || {}))
      
      // Try to insert a record with the missing columns
      const testAuditRecord = {
        event_type: 'test_column_check',
        device_fingerprint: 'test-fingerprint',
        archived: false,
        created_at: new Date().toISOString()
      }
      
      const { error: auditInsertError } = await supabase
        .from('audit_logs')
        .insert(testAuditRecord)
      
      if (auditInsertError) {
        console.log('ℹ️ Audit insert error (expected if columns missing):', auditInsertError.message)
        
        if (auditInsertError.message.includes('device_fingerprint')) {
          console.log('📝 device_fingerprint column is missing')
          console.log('💡 Please run the SQL fixes manually in your Supabase dashboard:')
          console.log('   1. Go to your Supabase project dashboard')
          console.log('   2. Navigate to SQL Editor')
          console.log('   3. Run the contents of fix-audit-logs-table-columns.sql')
        }
      } else {
        console.log('✅ audit_logs table has required columns')
        
        // Clean up test record
        await supabase
          .from('audit_logs')
          .delete()
          .eq('event_type', 'test_column_check')
      }
    }
    
    // Fix 3: Create verification_tokens table if it doesn't exist
    console.log('🔧 Checking verification_tokens table...')
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('id')
      .limit(1)
    
    if (tokenError && tokenError.code === 'PGRST205') {
      console.log('📝 verification_tokens table does not exist')
      console.log('💡 Please create it manually in your Supabase dashboard:')
      console.log('   1. Go to your Supabase project dashboard')
      console.log('   2. Navigate to SQL Editor')
      console.log('   3. Run the CREATE TABLE statement from fix-database-schema-issues.sql')
    } else if (tokenError) {
      console.log('ℹ️ Error checking verification_tokens:', tokenError.message)
    } else {
      console.log('✅ verification_tokens table exists')
    }
    
    console.log('✅ Column check completed!')
    console.log('📋 Summary of required manual fixes:')
    console.log('   1. Add identifier and action columns to rate_limit_attempts table')
    console.log('   2. Add device_fingerprint and archived columns to audit_logs table')
    console.log('   3. Create verification_tokens table if it does not exist')
    console.log('')
    console.log('💡 SQL files are ready in your project root:')
    console.log('   - fix-rate-limit-table-columns.sql')
    console.log('   - fix-audit-logs-table-columns.sql')
    console.log('   - fix-database-schema-issues.sql')
    
  } catch (error) {
    console.error('❌ Column fix failed:', error)
  }
}

fixMissingColumns()
  .then(() => {
    console.log('🎉 Database column check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Column fix script failed:', error)
    process.exit(1)
  })
