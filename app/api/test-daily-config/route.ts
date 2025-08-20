import { NextRequest, NextResponse } from 'next/server'
import { DAILY_CONFIG } from '@/lib/daily'

export async function GET() {
  try {
    // Check if API key is configured
    const hasApiKey = !!DAILY_CONFIG.DAILY_API_KEY
    const apiKeyLength = DAILY_CONFIG.DAILY_API_KEY?.length || 0
    const domain = DAILY_CONFIG.DAILY_DOMAIN

    // Test API key by making a simple request
    let apiTestResult = null
    if (hasApiKey) {
      try {
        const response = await fetch(`${DAILY_CONFIG.DAILY_URL}/rooms`, {
          headers: {
            'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
          }
        })
        
        apiTestResult = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        }
      } catch (error) {
        apiTestResult = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        hasApiKey,
        apiKeyLength,
        domain,
        dailyUrl: DAILY_CONFIG.DAILY_URL
      },
      apiTest: apiTestResult
    })

  } catch (error) {
    console.error('Daily config test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test Daily.co configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
