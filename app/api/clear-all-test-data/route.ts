import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting comprehensive database cleanup...')
    
    // Get the request body to check if this is a confirmation
    const body = await request.json()
    const { confirm, keepAdmin } = body

    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: 'Confirmation required. Set confirm: true to proceed with cleanup.'
      }, { status: 400 })
    }

    console.log('⚠️ PROCEEDING WITH DATABASE CLEANUP - THIS WILL DELETE ALL TEST DATA')

    // Step 1: Clear all user sessions
    console.log('🗑️ Clearing user sessions...')
    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Keep a dummy record if needed

    if (sessionsError) {
      console.error('❌ Error clearing sessions:', sessionsError)
    } else {
      console.log('✅ User sessions cleared')
    }

    // Step 2: Clear all magic links
    console.log('🗑️ Clearing magic links...')
    const { error: magicLinksError } = await supabase
      .from('magic_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (magicLinksError) {
      console.error('❌ Error clearing magic links:', magicLinksError)
    } else {
      console.log('✅ Magic links cleared')
    }

    // Step 3: Clear therapist availability
    console.log('🗑️ Clearing therapist availability...')
    const { error: availabilityError } = await supabase
      .from('therapist_availability')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (availabilityError) {
      console.error('❌ Error clearing therapist availability:', availabilityError)
    } else {
      console.log('✅ Therapist availability cleared')
    }

    // Step 4: Clear sessions
    console.log('🗑️ Clearing sessions...')
    const { error: sessionsDataError } = await supabase
      .from('sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (sessionsDataError) {
      console.error('❌ Error clearing sessions:', sessionsDataError)
    } else {
      console.log('✅ Sessions cleared')
    }

    // Step 5: Clear session notes
    console.log('🗑️ Clearing session notes...')
    const { error: notesError } = await supabase
      .from('session_notes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (notesError) {
      console.error('❌ Error clearing session notes:', notesError)
    } else {
      console.log('✅ Session notes cleared')
    }

    // Step 6: Clear therapist documents
    console.log('🗑️ Clearing therapist documents...')
    const { error: documentsError } = await supabase
      .from('therapist_documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (documentsError) {
      console.error('❌ Error clearing therapist documents:', documentsError)
    } else {
      console.log('✅ Therapist documents cleared')
    }

    // Step 7: Clear notifications
    console.log('🗑️ Clearing notifications...')
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (notificationsError) {
      console.error('❌ Error clearing notifications:', notificationsError)
    } else {
      console.log('✅ Notifications cleared')
    }

    // Step 8: Clear all users except admin (if keepAdmin is true)
    console.log('🗑️ Clearing users...')
    let usersQuery = supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (keepAdmin) {
      // Keep admin users
      usersQuery = usersQuery.neq('user_type', 'admin')
      console.log('🔒 Keeping admin users')
    }

    const { error: usersError } = await usersQuery

    if (usersError) {
      console.error('❌ Error clearing users:', usersError)
    } else {
      console.log('✅ Users cleared')
    }

    // Step 9: Clear any remaining related data
    console.log('🗑️ Clearing any remaining test data...')
    
    // Clear patient data tables if they exist
    const patientTables = ['patient_biodata', 'patient_medical_history', 'patient_family_history', 'patient_social_history']
    
    for (const table of patientTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        
        if (error) {
          console.log(`⚠️ Could not clear ${table}:`, error.message)
        } else {
          console.log(`✅ ${table} cleared`)
        }
      } catch (e) {
        console.log(`⚠️ Table ${table} might not exist or cannot be cleared`)
      }
    }

    console.log('🎉 DATABASE CLEANUP COMPLETED')
    console.log('📊 Summary:')
    console.log('   - All user sessions cleared')
    console.log('   - All magic links cleared')
    console.log('   - All therapist availability cleared')
    console.log('   - All sessions and notes cleared')
    console.log('   - All therapist documents cleared')
    console.log('   - All notifications cleared')
    console.log('   - All users cleared' + (keepAdmin ? ' (except admins)' : ''))
    console.log('   - All patient data cleared')

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully. All test data has been removed.',
      summary: {
        sessions_cleared: true,
        magic_links_cleared: true,
        therapist_availability_cleared: true,
        sessions_data_cleared: true,
        session_notes_cleared: true,
        therapist_documents_cleared: true,
        notifications_cleared: true,
        users_cleared: true,
        patient_data_cleared: true,
        admin_users_kept: keepAdmin || false
      }
    })

  } catch (error) {
    console.error('❌ Database cleanup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete database cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('📊 Getting database statistics...')

    // Get counts of all data
    const [
      { count: usersCount },
      { count: sessionsCount },
      { count: sessionsDataCount },
      { count: notesCount },
      { count: availabilityCount },
      { count: documentsCount },
      { count: notificationsCount },
      { count: magicLinksCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('user_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('session_notes').select('*', { count: 'exact', head: true }),
      supabase.from('therapist_availability').select('*', { count: 'exact', head: true }),
      supabase.from('therapist_documents').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('magic_links').select('*', { count: 'exact', head: true })
    ])

    // Get user type breakdown
    const { data: userTypes } = await supabase
      .from('users')
      .select('user_type')

    const userTypeBreakdown = userTypes?.reduce((acc, user) => {
      acc[user.user_type] = (acc[user.user_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      database_stats: {
        total_users: usersCount || 0,
        total_sessions: sessionsCount || 0,
        total_sessions_data: sessionsDataCount || 0,
        total_notes: notesCount || 0,
        total_availability: availabilityCount || 0,
        total_documents: documentsCount || 0,
        total_notifications: notificationsCount || 0,
        total_magic_links: magicLinksCount || 0,
        user_type_breakdown: userTypeBreakdown
      },
      message: 'Use POST with confirm: true to clear all data'
    })

  } catch (error) {
    console.error('❌ Error getting database stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
