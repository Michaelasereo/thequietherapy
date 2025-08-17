const { createClient } = require('@supabase/supabase-js')

async function testRealSession() {
  console.log('🧪 Testing real session from database...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Get the most recent session
    console.log('📋 Getting most recent session...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (sessionsError) {
      console.log('❌ Error getting sessions:', sessionsError.message)
      return
    }

    if (!sessions || sessions.length === 0) {
      console.log('❌ No sessions found')
      return
    }

    const session = sessions[0]
    console.log('✅ Found session:', session)

    // Create the cookie data that should be sent
    const cookieData = {
      id: session.user_id,
      email: 'asereopeyemimichael@gmail.com', // We'll get this from user table
      name: 'Michael Asere',
      session_token: session.session_token
    }

    console.log('🍪 Cookie data that should be sent:', cookieData)
    console.log('🔗 Test this URL with the cookie:')
    console.log(`curl -H "Cookie: trpi_user=${encodeURIComponent(JSON.stringify(cookieData))}" http://localhost:3000/api/auth/me`)

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single()

    if (userError) {
      console.log('❌ Error getting user:', userError.message)
    } else {
      console.log('👤 User data:', user)
      
      // Create the correct cookie data
      const correctCookieData = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        session_token: session.session_token
      }

      console.log('🍪 Correct cookie data:', correctCookieData)
      console.log('🔗 Test this URL with the correct cookie:')
      console.log(`curl -H "Cookie: trpi_user=${encodeURIComponent(JSON.stringify(correctCookieData))}" http://localhost:3000/api/auth/me`)
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testRealSession()
