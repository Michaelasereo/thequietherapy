import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only admins can clear therapists
    const { requireApiAuth } = await import('@/lib/server-auth')
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    console.log('🧹 Clearing all therapists and related data...')

    // Get therapist user IDs first for reference
    const { data: therapists, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('user_type', 'therapist')

    if (fetchError) {
      console.error('Error fetching therapists:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch therapists',
        details: fetchError.message
      }, { status: 500 })
    }

    const therapistIds = therapists?.map(t => t.id) || []
    const therapistCount = therapistIds.length

    console.log(`📊 Found ${therapistCount} therapist(s) to delete`)

    if (therapistCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No therapists to clear',
        deleted: {
          therapists: 0,
          enrollments: 0,
          sessions: 0,
          profiles: 0
        }
      })
    }

    // Delete in proper order (child tables first)

    // 1. Get session IDs first (before deleting sessions)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .in('therapist_id', therapistIds)
    
    const sessionIds = sessions?.map(s => s.id) || []
    
    // 2. Delete session notes first (child of sessions)
    if (sessionIds.length > 0) {
      const { error: sessionNotesError } = await supabase
        .from('session_notes')
        .delete()
        .in('session_id', sessionIds)

      if (sessionNotesError) {
        console.error('Error deleting session notes:', sessionNotesError)
      } else {
        console.log('✅ Session notes cleared')
      }
    }

    // 3. Delete sessions where therapist was involved
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .in('therapist_id', therapistIds)

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError)
    } else {
      console.log('✅ Sessions cleared')
    }

    // 4. Delete therapist availability
    const { error: availabilityError } = await supabase
      .from('therapist_availability')
      .delete()
      .in('therapist_id', therapistIds)

    if (availabilityError) {
      console.error('Error deleting availability:', availabilityError)
    } else {
      console.log('✅ Therapist availability cleared')
    }

    // 5. Delete therapist profiles
    const { error: profilesError } = await supabase
      .from('therapist_profiles')
      .delete()
      .in('user_id', therapistIds)

    if (profilesError) {
      console.error('Error deleting profiles:', profilesError)
    } else {
      console.log('✅ Therapist profiles cleared')
    }

    // 6. Delete therapist enrollments
    const { error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (enrollmentsError) {
      console.error('Error deleting enrollments:', enrollmentsError)
    } else {
      console.log('✅ Therapist enrollments cleared')
    }

    // 7. Delete therapist user accounts
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('user_type', 'therapist')

    if (usersError) {
      console.error('Error deleting therapist users:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete therapist users',
        details: usersError.message
      }, { status: 500 })
    }

    console.log('✅ All therapist users cleared')

    // Verify deletion
    const { data: remainingTherapists } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'therapist')

    const remainingCount = remainingTherapists?.length || 0

    if (remainingCount > 0) {
      console.warn(`⚠️  ${remainingCount} therapist(s) still remain`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${therapistCount} therapist(s)`,
      deleted: {
        therapists: therapistCount,
        enrollments: 'all',
        sessions: 'all related',
        profiles: 'all',
        availability: 'all'
      },
      remaining: remainingCount
    })

  } catch (error) {
    console.error('❌ Error clearing therapists:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error while clearing therapists',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

