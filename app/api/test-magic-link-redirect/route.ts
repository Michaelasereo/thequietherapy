import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkForAuthType } from '@/lib/auth'
import { authConfig } from '@/lib/auth-config'

/**
 * Test endpoint to create a magic link and return the full redirect URL
 * This helps test the complete flow without needing to check email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const email = searchParams.get('email') || 'test@example.com'
    const authType = (searchParams.get('auth_type') || 'individual') as 'individual' | 'therapist' | 'partner' | 'admin'

    console.log('🧪 Test magic link creation:', { email, authType })

    // Create magic link
    const result = await createMagicLinkForAuthType(
      email,
      authType,
      'login',
      { user_type: authType }
    )

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create magic link'
      }, { status: 500 })
    }

    // Get base URL
    const requestUrl = new URL(request.url)
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? authConfig.appUrl 
      : `${requestUrl.protocol}//${requestUrl.host}`

    // Construct the verification URL (same as what would be in email)
    const verificationUrl = `${baseUrl}/api/auth/verify-magic-link?token=${result.token}&auth_type=${authType}`

    // Determine expected redirect URL
    let expectedRedirect = `${baseUrl}/dashboard`
    if (authType === 'therapist') expectedRedirect = `${baseUrl}/therapist/dashboard`
    if (authType === 'partner') expectedRedirect = `${baseUrl}/partner/dashboard`
    if (authType === 'admin') expectedRedirect = `${baseUrl}/admin/dashboard`

    return NextResponse.json({
      success: true,
      message: 'Magic link created successfully',
      testInstructions: [
        '1. Copy the verification URL below',
        '2. Open it in your browser',
        '3. It should redirect to the dashboard',
        '4. Check the console logs for detailed information'
      ],
      magicLink: {
        token: result.token,
        authType,
        email,
        verificationUrl,
        expectedRedirect,
        // Direct link to test (click to test)
        clickToTest: verificationUrl
      },
      expectedFlow: {
        step1: 'Click verification URL',
        step2: 'Magic link verified',
        step3: 'Cookie set (quiet_session)',
        step4: `Redirect to: ${expectedRedirect}`,
        step5: 'Dashboard loads with session'
      }
    })

  } catch (error: any) {
    console.error('❌ Test magic link error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

