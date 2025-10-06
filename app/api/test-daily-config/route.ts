import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_DOMAIN = process.env.DAILY_DOMAIN

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Daily.co configuration...')
    
    const config = {
      hasApiKey: !!DAILY_API_KEY,
      apiKeyLength: DAILY_API_KEY?.length || 0,
      hasDomain: !!DAILY_DOMAIN,
      domain: DAILY_DOMAIN || 'Not set',
      isValid: false,
      error: null as string | null,
      permissions: null as any
    }

    if (!DAILY_API_KEY) {
      config.error = 'DAILY_API_KEY environment variable is not set'
      return NextResponse.json(config, { status: 400 })
    }

    if (!DAILY_DOMAIN) {
      config.error = 'DAILY_DOMAIN environment variable is not set'
      return NextResponse.json(config, { status: 400 })
    }

    // Test API key by making a simple request to list rooms
    console.log('🔑 Testing API key permissions...')
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    const responseData = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('❌ Daily.co API key test failed:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      })

      let errorMessage = 'API key validation failed'
      if (response.status === 401) {
        errorMessage = 'Invalid Daily.co API key - please check your credentials'
      } else if (response.status === 403) {
        errorMessage = 'API key does not have sufficient permissions'
      } else {
        errorMessage = `API error: ${response.status} ${response.statusText}`
      }

      config.error = errorMessage
      config.permissions = responseData
      return NextResponse.json(config, { status: response.status })
    }

    // Test room creation permissions by attempting to create a test room
    console.log('🏗️ Testing room creation permissions...')
    const testRoomName = `test-config-${Date.now()}`
    
    const createResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: testRoomName,
        privacy: 'private',
        properties: {
          exp: Math.round(Date.now() / 1000) + (60 * 5), // 5 minutes
          eject_at_room_exp: true,
        }
      }),
    })

    const createData = await createResponse.json().catch(() => ({}))

    if (createResponse.ok) {
      console.log('✅ Test room created successfully, cleaning up...')
      
      // Clean up the test room
      try {
        await fetch(`https://api.daily.co/v1/rooms/${testRoomName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        })
        console.log('🧹 Test room cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup test room:', cleanupError)
      }

      config.isValid = true
      config.permissions = {
        canListRooms: true,
        canCreateRooms: true,
        canDeleteRooms: true
      }
    } else {
      console.error('❌ Room creation test failed:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        data: createData
      })

      config.error = `Room creation failed: ${createData.error || createResponse.statusText}`
      config.permissions = {
        canListRooms: true,
        canCreateRooms: false,
        canDeleteRooms: false,
        createError: createData
      }
    }

    console.log('✅ Daily.co configuration test completed')
    return NextResponse.json(config)

  } catch (error) {
    console.error('💥 Daily.co configuration test error:', error)
    return NextResponse.json({
      hasApiKey: !!DAILY_API_KEY,
      apiKeyLength: DAILY_API_KEY?.length || 0,
      hasDomain: !!DAILY_DOMAIN,
      domain: DAILY_DOMAIN || 'Not set',
      isValid: false,
      error: `Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      permissions: null
    }, { status: 500 })
  }
}