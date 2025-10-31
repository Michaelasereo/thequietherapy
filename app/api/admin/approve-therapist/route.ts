import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, action } = await request.json()

    if (!enrollmentId || !action) {
      return NextResponse.json(
        { success: false, error: 'Enrollment ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      )
    }

    console.log(`📋 Admin ${action}ing therapist enrollment:`, enrollmentId)

    // Get the enrollment details
    const { data: enrollment, error: fetchError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single()

    if (fetchError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update the enrollment status
    const { error: updateError } = await supabase
      .from('therapist_enrollments')
      .update({ 
        status: newStatus,
        is_active: action === 'approve',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update enrollment status' },
        { status: 500 }
      )
    }

    // If approved, create/update user account and therapist profile
    if (action === 'approve') {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', enrollment.email)
        .single()

      let userId = existingUser?.id

      if (!existingUser) {
        // Create new user account
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: enrollment.email,
            full_name: enrollment.full_name,
            user_type: 'therapist',
            is_verified: true,
            is_active: true,
            credits: 0
          })
          .select('id')
          .single()

        if (userError) {
          console.error('Error creating user account:', userError)
          return NextResponse.json(
            { success: false, error: 'Failed to create user account' },
            { status: 500 }
          )
        }
        userId = newUser.id
      } else {
        // Update existing user to verified status
        const { error: updateUserError } = await supabase
          .from('users')
          .update({
            is_verified: true,
            is_active: true
          })
          .eq('id', existingUser.id)

        if (updateUserError) {
          console.error('Error updating user verification:', updateUserError)
        }
      }

      // Update therapist profile verification status
      if (userId) {
        const { error: profileError } = await supabase
          .from('therapist_profiles')
          .update({
            is_verified: true,
            verification_status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (profileError) {
          console.error('Error updating therapist profile verification:', profileError)
          // Try to create the profile if it doesn't exist
          console.log('🔄 Attempting to create missing therapist_profiles entry...')
          const { error: createError } = await supabase
            .from('therapist_profiles')
            .insert({
              user_id: userId,
              verification_status: 'approved',
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createError) {
            console.error('Error creating therapist profile verification:', createError)
            // Don't fail the approval, just log the error
          } else {
            console.log('✅ Created missing therapist_profiles entry successfully')
          }
        } else {
          console.log('✅ Updated therapist profile verification status for user:', userId)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Therapist enrollment ${action}d successfully`,
      enrollment: {
        id: enrollment.id,
        full_name: enrollment.full_name,
        email: enrollment.email,
        status: newStatus
      }
    })

  } catch (error) {
    console.error('Error in approve-therapist API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
