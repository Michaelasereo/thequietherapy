import { NextRequest, NextResponse } from 'next/server'
import { getHealthStatus } from '@/lib/monitoring'

// Critical health check endpoint for monitoring
export async function GET(request: NextRequest) {
  try {
    const health = getHealthStatus()
    
    // Return appropriate status code based on health
    const statusCode = health.healthy ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      healthy: false,
      status: 'ERROR',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
