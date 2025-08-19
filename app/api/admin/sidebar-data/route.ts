import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch pending therapist verifications
    const { data: pendingTherapists, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'pending')

    if (therapistError) throw therapistError

    // Fetch pending partner verifications (users with user_type = 'partner' and is_verified = false)
    const { data: pendingPartners, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'partner')
      .eq('is_verified', false)

    if (partnerError) throw partnerError

    // Fetch unread notifications
    const { data: unreadNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)

    if (notificationsError) throw notificationsError

    // Fetch critical system alerts (notifications with high severity)
    const { data: criticalAlerts, error: alertsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'system_alert')
      .eq('is_read', false)

    if (alertsError) throw alertsError

    // Calculate counts
    const pendingActions = (pendingTherapists?.length || 0) + (pendingPartners?.length || 0)
    const criticalAlertsCount = criticalAlerts?.length || 0
    const unreadNotificationsCount = unreadNotifications?.length || 0

    // Get user counts by type
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_type, is_active')

    if (usersError) throw usersError

    const userCounts = {
      total: users?.length || 0,
      individual: users?.filter(u => u.user_type === 'individual').length || 0,
      therapist: users?.filter(u => u.user_type === 'therapist').length || 0,
      partner: users?.filter(u => u.user_type === 'partner').length || 0,
      admin: users?.filter(u => u.user_type === 'admin').length || 0,
      active: users?.filter(u => u.is_active).length || 0
    }

    // Get session count
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')

    if (sessionsError) throw sessionsError

    const sessionCount = sessions?.length || 0

    return NextResponse.json({
      sidebarData: {
        pendingActions,
        criticalAlerts: criticalAlertsCount,
        unreadNotifications: unreadNotificationsCount
      },
      counts: {
        users: userCounts,
        sessions: sessionCount,
        pendingTherapists: pendingTherapists?.length || 0,
        pendingPartners: pendingPartners?.length || 0
      },
      details: {
        pendingTherapists: pendingTherapists || [],
        pendingPartners: pendingPartners || [],
        unreadNotifications: unreadNotifications || [],
        criticalAlerts: criticalAlerts || []
      }
    })
  } catch (error) {
    console.error('Error fetching admin sidebar data:', error)
    return NextResponse.json({
      sidebarData: {
        pendingActions: 0,
        criticalAlerts: 0,
        unreadNotifications: 0
      },
      counts: {
        users: { total: 0, individual: 0, therapist: 0, partner: 0, admin: 0, active: 0 },
        sessions: 0,
        pendingTherapists: 0,
        pendingPartners: 0
      },
      details: {
        pendingTherapists: [],
        pendingPartners: [],
        unreadNotifications: [],
        criticalAlerts: []
      }
    }, { status: 500 })
  }
}
