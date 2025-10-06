const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthStatus() {
  console.log('🔍 Testing authentication system status...')
  
  try {
    // Test 1: Check if verification_tokens table exists
    console.log('📋 Testing verification_tokens table...')
    const { data: tokensData, error: tokensError } = await supabase
      .from('verification_tokens')
      .select('id')
      .limit(1)
    
    if (tokensError) {
      console.log('❌ verification_tokens table issue:', tokensError.message)
    } else {
      console.log('✅ verification_tokens table is working')
    }
    
    // Test 2: Check if rate_limit_attempts table has required columns
    console.log('📋 Testing rate_limit_attempts table...')
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .limit(1)
    
    if (rateLimitError) {
      console.log('❌ rate_limit_attempts table issue:', rateLimitError.message)
    } else {
      console.log('✅ rate_limit_attempts table is working')
    }
    
    // Test 3: Check if audit_logs table has required columns
    console.log('📋 Testing audit_logs table...')
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1)
    
    if (auditError) {
      console.log('❌ audit_logs table issue:', auditError.message)
    } else {
      console.log('✅ audit_logs table is working')
    }
    
    // Test 4: Check if users table is working
    console.log('📋 Testing users table...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .limit(1)
    
    if (usersError) {
      console.log('❌ users table issue:', usersError.message)
    } else {
      console.log('✅ users table is working')
    }
    
    console.log('🎉 Authentication system test completed!')
    console.log('')
    console.log('💡 If you see any errors above, run the quick-database-fix.sql in your Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAuthStatus()
  .then(() => {
    console.log('✅ Auth status test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Auth status test failed:', error)
    process.exit(1)
  })
