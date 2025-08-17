async function testAuthFlow() {
  console.log('🧪 Testing complete authentication flow...')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Step 1: Login
    console.log('1️⃣ Testing login...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'asereopeyemimichael@gmail.com' })
    })
    
    const loginData = await loginResponse.json()
    console.log('Login response:', loginData)
    
    if (!loginData.success) {
      console.log('❌ Login failed')
      return
    }
    
    // Step 2: Test the /api/auth/me endpoint with a mock session
    console.log('3️⃣ Testing /api/auth/me with mock session...')
    
    const mockSession = {
      id: 'test-id',
      email: 'asereopeyemimichael@gmail.com',
      name: 'Michael Asere',
      session_token: 'test-session-token'
    }
    
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': `trpi_user=${encodeURIComponent(JSON.stringify(mockSession))}`
      }
    })
    
    const meData = await meResponse.json()
    console.log('Me response:', meData)
    console.log('Me status:', meResponse.status)
    
    // Step 3: Test dashboard access
    console.log('4️⃣ Testing dashboard access...')
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        'Cookie': `trpi_user=${encodeURIComponent(JSON.stringify(mockSession))}`
      }
    })
    
    console.log('Dashboard status:', dashboardResponse.status)
    console.log('Dashboard URL:', dashboardResponse.url)
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testAuthFlow()
