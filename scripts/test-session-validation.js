const { createClient } = require('@supabase/supabase-js')

async function testSessionValidation() {
  console.log('🔍 Testing session validation...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // First, let's check if the validate_session function exists
    console.log('📋 Checking if validate_session function exists...')
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'validate_session')

    if (funcError) {
      console.log('❌ Error checking functions:', funcError.message)
    } else {
      console.log('✅ Functions found:', functions)
    }

    // Let's check what sessions exist
    console.log('📋 Checking existing sessions...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')

    if (sessionsError) {
      console.log('❌ Error checking sessions:', sessionsError.message)
    } else {
      console.log('✅ Sessions found:', sessions)
    }

    // Let's check what users exist
    console.log('📋 Checking existing users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      console.log('❌ Error checking users:', usersError.message)
    } else {
      console.log('✅ Users found:', users)
    }

    // Test the validate_session function with a real session token
    if (sessions && sessions.length > 0) {
      const testToken = sessions[0].session_token
      console.log('🧪 Testing validate_session with token:', testToken)
      
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_session', {
          p_session_token: testToken
        })

      if (validationError) {
        console.log('❌ Session validation error:', validationError.message)
      } else {
        console.log('✅ Session validation result:', validation)
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testSessionValidation()
