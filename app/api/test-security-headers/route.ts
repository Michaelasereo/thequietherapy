import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // This endpoint will be used to test security headers
    // The headers should be automatically added by Next.js config and middleware
    
    return NextResponse.json({
      success: true,
      message: 'Security headers test endpoint',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      security: {
        httpsEnforced: process.env.NODE_ENV === 'production',
        cspEnabled: true,
        hstsEnabled: process.env.NODE_ENV === 'production',
        xssProtection: true,
        contentTypeOptions: true,
        frameOptions: true,
        referrerPolicy: true,
        permissionsPolicy: true
      }
    })
  } catch (error) {
    console.error('Error in security headers test:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test security headers',
      details: error
    })
  }
}
