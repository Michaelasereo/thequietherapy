const { createClient } = require('@supabase/supabase-js')

async function debugSessions() {
  console.log('🔍 Debugging sessions...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Check all sessions
    console.log('📋 Checking all sessions...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')

    if (sessionsError) {
      console.log('❌ Error checking sessions:', sessionsError.message)
    } else {
      console.log('✅ Sessions found:', sessions)
    }

    // Check all users
    console.log('📋 Checking all users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      console.log('❌ Error checking users:', usersError.message)
    } else {
      console.log('✅ Users found:', users)
    }

    // Check all magic links
    console.log('📋 Checking all magic links...')
    const { data: magicLinks, error: magicLinksError } = await supabase
      .from('magic_links')
      .select('*')

    if (magicLinksError) {
      console.log('❌ Error checking magic links:', magicLinksError.message)
    } else {
      console.log('✅ Magic links found:', magicLinks)
    }

    // Test session validation with a real session token
    if (sessions && sessions.length > 0) {
      const testToken = sessions[0].session_token
      console.log('🧪 Testing session validation with token:', testToken)
      
      // Test the direct query that /api/auth/me uses
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          session_token,
          expires_at,
          users!inner (
            id,
            email,
            full_name,
            user_type,
            is_verified,
            is_active,
            credits,
            package_type
          )
        `)
        .eq('session_token', testToken)
        .gt('expires_at', new Date().toISOString())
        .single()

      console.log('🧪 Session validation result:', { sessionData, sessionError })
    }

  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

// Run the debug
debugSessions()
