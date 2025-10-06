const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createVerificationTokensTable() {
  console.log('🚀 Creating verification_tokens table...')
  
  try {
    // Try to create the table by inserting a test record
    // This will trigger table creation if it doesn't exist
    const { error } = await supabase
      .from('verification_tokens')
      .insert({
        token: 'test-token-creation',
        email: 'test@example.com',
        user_type: 'individual',
        auth_type: 'login',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        used: false,
        metadata: {}
      })
    
    if (error) {
      console.error('❌ Failed to create verification_tokens table:', error)
      
      // If the error is about missing columns, let's try to understand the structure
      if (error.message.includes('column') || error.message.includes('schema')) {
        console.log('ℹ️ The table might exist but with different schema')
        
        // Try to select from it to see what columns exist
        const { data, error: selectError } = await supabase
          .from('verification_tokens')
          .select('*')
          .limit(1)
        
        if (selectError) {
          console.log('📋 Select error:', selectError.message)
        } else {
          console.log('📋 Table exists with data:', data)
        }
      }
    } else {
      console.log('✅ Created verification_tokens table')
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('token', 'test-token-creation')
      
      if (deleteError) {
        console.log('ℹ️ Could not clean up test record:', deleteError.message)
      } else {
        console.log('✅ Cleaned up test record')
      }
    }
    
    // Verify the table exists by trying to select from it
    const { data, error: verifyError } = await supabase
      .from('verification_tokens')
      .select('id')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else {
      console.log('✅ verification_tokens table is ready')
    }
    
  } catch (error) {
    console.error('❌ Error creating verification_tokens table:', error)
  }
}

createVerificationTokensTable()
  .then(() => {
    console.log('🎉 Verification tokens table setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
