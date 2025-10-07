import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { id, type, action, approvalType } = await request.json()

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle availability approval separately from general verification
    if (approvalType === 'availability') {
      return await handleAvailabilityApproval(id, type, action)
    }

    if (type === 'therapist') {
      // Update therapist enrollment status
      const { error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (enrollmentError) {
        console.error('Error updating therapist enrollment:', enrollmentError)
        return NextResponse.json({ error: 'Failed to update therapist enrollment' }, { status: 500 })
      }

      // If approving, also update the user account
      if (action === 'approve') {
        // Get the therapist email from enrollment
        const { data: enrollment, error: getError } = await supabase
          .from('therapist_enrollments')
          .select('email')
          .eq('id', id)
          .single()

        if (getError || !enrollment) {
          console.error('Error getting therapist email:', getError)
          return NextResponse.json({ error: 'Failed to get therapist email' }, { status: 500 })
        }

        // Update user account
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            is_verified: true,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', enrollment.email)

        if (userError) {
          console.error('Error updating user account:', userError)
          return NextResponse.json({ error: 'Failed to update user account' }, { status: 500 })
        }
      }

    } else if (type === 'partner') {
      // Update partner enrollment status
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          partner_status: action === 'approve' ? 'active' : 'rejected',
          is_verified: action === 'approve',
          is_active: action === 'approve',
          approval_date: action === 'approve' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (userError) {
        console.error('Error updating partner user:', userError)
        return NextResponse.json({ error: 'Failed to update partner user' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      invalidates: ['therapist-profile']
    })

  } catch (error) {
    console.error('Error in approve-verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleAvailabilityApproval(id: string, type: string, action: string) {
  try {
    if (type === 'therapist') {
      // Get the therapist email from enrollment
      const { data: enrollment, error: getError } = await supabase
        .from('therapist_enrollments')
        .select('email')
        .eq('id', id)
        .single()

      if (getError || !enrollment) {
        console.error('Error getting therapist email:', getError)
        return NextResponse.json({ error: 'Failed to get therapist email' }, { status: 500 })
      }

      // Update therapist enrollment status based on availability approval
      const { error: enrollmentError } = await supabase
        .from('therapist_enrollments')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (enrollmentError) {
        console.error('Error updating therapist availability approval:', enrollmentError)
        return NextResponse.json({ error: 'Failed to update availability approval' }, { status: 500 })
      }

      // Update user account with verification status
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          is_verified: action === 'approve',
          is_active: action === 'approve',
          updated_at: new Date().toISOString()
        })
        .eq('email', enrollment.email)

      if (userError) {
        console.error('Error updating user availability approval:', userError)
        return NextResponse.json({ error: 'Failed to update user availability approval' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Therapist availability ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      invalidates: ['therapist-profile']
    })

  } catch (error) {
    console.error('Error in handleAvailabilityApproval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
