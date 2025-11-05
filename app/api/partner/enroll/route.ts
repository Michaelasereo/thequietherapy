import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMagicLinkForAuthType } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationName,
      email,
      phone,
      website,
      organizationType,
      numberOfEmployees,
      servicesOffered,
      targetAudience,
      partnershipGoals
    } = body

    console.log('🚀 Partner enrollment request for:', email)

    // Validate required fields
    if (!organizationName || !email || !phone || !organizationType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: organization name, email, phone, and organization type are required'
      }, { status: 400 })
    }

    // Check if user already exists (any type)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Database error while checking existing user'
      }, { status: 500 })
    }

    if (existingUser) {
      if (existingUser.user_type === 'partner') {
        // Partner already exists - send magic link instead
        console.log('✅ Partner already exists, sending magic link:', existingUser.id)
        
        const magicLinkResult = await createMagicLinkForAuthType(
          email,
          'partner',
          'login',
          {
            user_type: 'partner',
            partner_id: existingUser.id
          }
        )

        if (magicLinkResult.success) {
          return NextResponse.json({
            success: true,
            message: 'A partner account with this email already exists. Magic link sent to your email.',
            partner_id: existingUser.id,
            email: email
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'A partner account with this email already exists, but we could not send a login link. Please try logging in manually.'
          }, { status: 400 })
        }
      } else {
        // Email exists but is not a partner
        return NextResponse.json({
          success: false,
          error: `This email is already registered as a ${existingUser.user_type}. Please use a different email or log in with your existing account.`
        }, { status: 400 })
      }
    }

    // Create partner user with pending status but temporary approval for access
    const { data: newPartner, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: organizationName,
        user_type: 'partner',
        company_name: organizationName,
        organization_type: organizationType,
        partner_status: 'pending', // Pending admin approval
        temporary_approval: true, // Allow full access during review
        is_verified: true, // Auto-verified for immediate access
        is_active: true,
        credits: 0,
        package_type: 'Partner',
        approval_date: new Date().toISOString(), // Auto-approved
        // Store additional enrollment data in onboarding_data JSON field
        onboarding_data: {
          phone,
          website,
          numberOfEmployees,
          servicesOffered,
          targetAudience,
          partnershipGoals,
          enrollmentDate: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating partner:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create partner account',
        details: createError.message,
        code: createError.code
      }, { status: 500 })
    }

    console.log('✅ Partner created with pending status:', newPartner.id)

    // Send magic link for immediate dashboard access
    const magicLinkResult = await createMagicLinkForAuthType(
      email,
      'partner',
      'login',
      {
        user_type: 'partner',
        partner_id: newPartner.id
      }
    )

    if (!magicLinkResult.success) {
      console.error('Failed to create magic link:', magicLinkResult.error)
      // Partner was created but magic link failed - still return success but warn
      return NextResponse.json({
        success: true,
        message: 'Partner account created but magic link failed. Please try logging in manually.',
        partner_id: newPartner.id,
        magic_link_error: magicLinkResult.error
      })
    }

    console.log('✅ Magic link sent to partner:', email)

    return NextResponse.json({
      success: true,
      message: 'Partner enrollment successful. Magic link sent to your email.',
      partner_id: newPartner.id,
      email: email
    })

  } catch (error) {
    console.error('❌ Partner enrollment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during partner enrollment'
    }, { status: 500 })
  }
}
