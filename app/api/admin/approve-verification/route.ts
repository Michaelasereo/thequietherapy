import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TherapistConsistencyManager } from '@/lib/therapist-consistency'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { id, type, action } = await request.json()

    console.log(`🔍 Approval request received:`, { id, type, action })

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (type === 'therapist') {
      // Try to get enrollment by ID first (for approvals from pending verifications card)
      let { data: enrollment, error: getError } = await supabase
        .from('therapist_enrollments')
        .select('id, email, full_name')
        .eq('id', id)
        .single()

      // If not found, the ID might be a user ID (for approvals from therapists table)
      if (getError || !enrollment) {
        console.log('🔍 ID not found in enrollments, trying to find by user ID...')
        
        // Get user email first
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', id)
          .single()

        if (userError || !user) {
          console.error('❌ Error getting user:', userError)
          return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
        }

        // Then find enrollment by email
        const { data: enrollmentByEmail, error: enrollmentError } = await supabase
          .from('therapist_enrollments')
          .select('id, email, full_name')
          .eq('email', user.email)
          .single()

        if (enrollmentError || !enrollmentByEmail) {
          console.error('❌ Error getting enrollment by email:', enrollmentError)
          return NextResponse.json({ error: 'Therapist enrollment not found' }, { status: 404 })
        }

        enrollment = enrollmentByEmail
        console.log('✅ Found enrollment by user email:', enrollment.email)
      }

      console.log(`📧 Processing ${action} for therapist:`, enrollment.full_name, enrollment.email)

      if (action === 'approve') {
        // Use consistency manager for approval to ensure both tables are updated atomically
        const result = await TherapistConsistencyManager.approveTherapist(enrollment.email)
        
        if (!result.success) {
          console.error('❌ Approval failed via consistency manager:', result.error)
          return NextResponse.json({ error: result.error }, { status: 500 })
        }

        console.log('✅ Therapist approved via consistency manager')
      } else {
        // Rejection: Update both tables
        const { error: enrollmentError } = await supabase
          .from('therapist_enrollments')
          .update({ 
            status: 'rejected',
            is_active: false,
            approved_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id)

        if (enrollmentError) {
          console.error('❌ Error updating therapist enrollment:', enrollmentError)
          return NextResponse.json({ error: 'Failed to update therapist enrollment' }, { status: 500 })
        }

        const { error: userError } = await supabase
          .from('users')
          .update({ 
            is_verified: false,
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('email', enrollment.email)

        if (userError) {
          console.error('❌ Error updating user account:', userError)
          return NextResponse.json({ error: 'Failed to update user account' }, { status: 500 })
        }

        console.log('✅ Therapist rejected')
      }

      // Validate consistency after update
      const validation = await TherapistConsistencyManager.validateConsistency(enrollment.email)
      if (!validation.isConsistent) {
        console.error('⚠️ Data inconsistency detected after update:', validation.issues)
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

    console.log(`✅ ${type} ${action} completed successfully`)

    return NextResponse.json({ 
      success: true, 
      message: `${type} ${action === 'approve' ? 'approved' : 'rejected'} successfully (including availability)`,
      invalidates: ['therapist-profile']
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Error in approve-verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
