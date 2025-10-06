import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SessionManager } from '@/lib/session-manager'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication - only admins can unapprove therapists
    const session = await SessionManager.getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required' }, { status: 403 })
    }

    const { therapistId, reason } = await request.json()

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    console.log('🔍 Admin unapproving therapist:', { therapistId, reason })

    // Get therapist details for logging
    const { data: therapist, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, email, user_type')
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single()

    if (fetchError || !therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Update user account to unverified and inactive
    const { error: userError } = await supabase
      .from('users')
      .update({
        is_verified: false,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', therapistId)
      .eq('user_type', 'therapist')

    if (userError) {
      console.error('❌ Error updating therapist user:', userError)
      return NextResponse.json({ error: 'Failed to update therapist user status' }, { status: 500 })
    }

    // Check if therapist profile exists first
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('therapist_profiles')
      .select('id, user_id, verification_status, is_verified')
      .eq('user_id', therapistId)
      .single()

    if (profileCheckError) {
      console.error('❌ Error checking therapist profile:', profileCheckError)
      console.error('❌ Profile check error details:', profileCheckError.message, profileCheckError.details, profileCheckError.hint)
      return NextResponse.json({ error: 'Failed to find therapist profile' }, { status: 500 })
    }

    if (!existingProfile) {
      console.error('❌ No therapist profile found for user:', therapistId)
      return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
    }

    console.log('🔍 Found therapist profile:', existingProfile)

    // Update therapist profile to pending status
    const { error: profileError } = await supabase
      .from('therapist_profiles')
      .update({
        verification_status: 'pending',
        is_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', therapistId)

    if (profileError) {
      console.error('❌ Error updating therapist profile:', profileError)
      console.error('❌ Profile error details:', profileError.message, profileError.details, profileError.hint)
      return NextResponse.json({ error: 'Failed to update therapist profile status' }, { status: 500 })
    }

    console.log('✅ Therapist unapproved successfully:', therapist.full_name)

    return successResponse({
      message: 'Therapist unapproved successfully',
      therapist: {
        id: therapist.id,
        full_name: therapist.full_name,
        email: therapist.email,
        status: 'pending',
        reason: reason || null
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET endpoint to get therapist details for unapproval
export async function GET(request: NextRequest) {
  try {
    // SECURE Authentication - only admins can access this
    const session = await SessionManager.getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    // Get therapist details
    const { data: therapist, error: fetchError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        user_type,
        is_verified,
        is_active,
        created_at,
        therapist_profiles (
          verification_status,
          is_verified,
          mdcn_code,
          specialization,
          languages,
          phone,
          bio
        )
      `)
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single()

    if (fetchError || !therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    return successResponse({
      therapist: {
        id: therapist.id,
        full_name: therapist.full_name,
        email: therapist.email,
        user_type: therapist.user_type,
        is_verified: therapist.is_verified,
        is_active: therapist.is_active,
        created_at: therapist.created_at,
        profile: therapist.therapist_profiles?.[0] || null
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
