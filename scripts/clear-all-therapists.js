require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllTherapists() {
  console.log('🧹 Clearing all therapists and related data...\n')

  try {
    // Get therapist user IDs first
    const { data: therapists, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('user_type', 'therapist')

    if (fetchError) {
      console.error('❌ Error fetching therapists:', fetchError)
      process.exit(1)
    }

    const therapistIds = therapists?.map(t => t.id) || []
    const therapistCount = therapistIds.length

    console.log(`📊 Found ${therapistCount} therapist(s) to delete:`)
    therapists?.forEach(t => {
      console.log(`   - ${t.email} (${t.full_name})`)
    })

    if (therapistCount === 0) {
      console.log('\n✅ No therapists to clear')
      return
    }

    console.log('\n🗑️  Starting deletion...\n')

    // 1. Get session IDs first (before deleting sessions)
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .in('therapist_id', therapistIds)
    
    const sessionIds = sessions?.map(s => s.id) || []
    console.log(`   Found ${sessionIds.length} session(s)`)

    // 2. Delete session notes (child of sessions)
    if (sessionIds.length > 0) {
      const { error: notesError } = await supabase
        .from('session_notes')
        .delete()
        .in('session_id', sessionIds)

      if (notesError) {
        console.warn('   ⚠️  Error deleting session notes:', notesError.message)
      } else {
        console.log('   ✅ Session notes cleared')
      }
    }

    // 3. Delete sessions
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .in('therapist_id', therapistIds)

    if (sessionsError) {
      console.error('   ❌ Error deleting sessions:', sessionsError.message)
    } else {
      console.log('   ✅ Sessions cleared')
    }

    // 4. Delete therapist availability
    const { error: availabilityError } = await supabase
      .from('therapist_availability')
      .delete()
      .in('therapist_id', therapistIds)

    if (availabilityError) {
      console.warn('   ⚠️  Error deleting availability:', availabilityError.message)
    } else {
      console.log('   ✅ Therapist availability cleared')
    }

    // 5. Delete therapist profiles
    const { error: profilesError } = await supabase
      .from('therapist_profiles')
      .delete()
      .in('user_id', therapistIds)

    if (profilesError) {
      console.warn('   ⚠️  Error deleting profiles:', profilesError.message)
    } else {
      console.log('   ✅ Therapist profiles cleared')
    }

    // 6. Delete therapist enrollments
    const { error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (enrollmentsError) {
      console.warn('   ⚠️  Error deleting enrollments:', enrollmentsError.message)
    } else {
      console.log('   ✅ Therapist enrollments cleared')
    }

    // 7. Delete therapist user accounts
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('user_type', 'therapist')

    if (usersError) {
      console.error('   ❌ Error deleting therapist users:', usersError.message)
      process.exit(1)
    }

    console.log('   ✅ Therapist users cleared\n')

    // Verify deletion
    const { data: remainingTherapists, error: verifyError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'therapist')

    const remainingCount = remainingTherapists?.length || 0

    if (remainingCount === 0) {
      console.log('✅ Successfully cleared all therapists!')
      console.log(`   Deleted: ${therapistCount} therapist(s)`)
    } else {
      console.warn(`⚠️  ${remainingCount} therapist(s) still remain`)
    }

    // Check remaining enrollments
    const { data: remainingEnrollments } = await supabase
      .from('therapist_enrollments')
      .select('id')

    const enrollmentCount = remainingEnrollments?.length || 0
    console.log(`   Remaining enrollments: ${enrollmentCount}`)

    // Check remaining sessions
    const { data: remainingSessions } = await supabase
      .from('sessions')
      .select('id')
      .in('therapist_id', therapistIds)

    const sessionCount = remainingSessions?.length || 0
    console.log(`   Remaining sessions: ${sessionCount}`)

  } catch (error) {
    console.error('❌ Error clearing therapists:', error)
    process.exit(1)
  }
}

// Run the script
clearAllTherapists()
  .then(() => {
    console.log('\n✅ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

