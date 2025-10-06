import { NextRequest, NextResponse } from 'next/server'
import { partnerOnboardingAction } from '@/actions/partner-auth'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Partner onboarding endpoint. Use POST to submit onboarding data.' 
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert JSON body to FormData format expected by the action
    const formData = new FormData()
    formData.append('organizationName', body.organizationName || '')
    formData.append('contactName', body.contactName || '')
    formData.append('email', body.email || '')
    formData.append('employeeCount', body.employeeCount || '')
    formData.append('industry', body.industry || '')
    formData.append('address', body.address || '')
    formData.append('phone', body.phone || '')
    formData.append('termsAccepted', body.termsAccepted ? 'on' : '')

    // Call the existing onboarding action
    const result = await partnerOnboardingAction(null, formData)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.success 
      }, { status: 201 })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Partner onboarding API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
