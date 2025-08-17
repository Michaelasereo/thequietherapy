import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkForAuthType } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, organizationName, contactName } = await request.json()

    console.log('🧪 Testing partner onboarding for:', { email, organizationName, contactName })

    // Test creating a partner signup magic link
    const result = await createMagicLinkForAuthType(
      email,
      'partner',
      'signup',
      {
        first_name: contactName,
        user_type: 'partner',
        organization_name: organizationName,
        phone: '+2341234567890',
        employee_count: '11-50',
        industry: 'Hospital'
      }
    )

    console.log('🧪 Partner onboarding test result:', result)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Partner onboarding magic link created successfully',
        token: result.token?.substring(0, 8) + '...'
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('🧪 Partner onboarding test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed' 
    }, { status: 500 })
  }
}
