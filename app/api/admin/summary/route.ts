import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/server-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // SECURE Authentication Check - only admins can access summary
    const authResult = await requireApiAuth(['admin'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    console.log('🔍 Admin summary accessed by:', session.user.email)
    // Fetch user counts by type
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_type, is_active, is_verified')

    if (usersError) throw usersError

    // Fetch session data
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('status, created_at')

    if (sessionsError) throw sessionsError

    // Fetch pending verifications
    const { data: pendingVerifications, error: verificationsError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (verificationsError) throw verificationsError

    // Calculate summary data
    const totalUsers = users?.length || 0
    const totalTherapists = users?.filter(u => u.user_type === 'therapist').length || 0
    const totalPartners = users?.filter(u => u.user_type === 'partner').length || 0
    const totalSessions = sessions?.length || 0
    const pendingVerificationsCount = pendingVerifications?.length || 0
    const totalRevenue = 0 // Sessions don't have amount field, calculate from other sources if needed
    const activeSessions = sessions?.filter(s => s.status === 'scheduled').length || 0

    return NextResponse.json({
      totalUsers,
      totalTherapists,
      totalPartners,
      totalSessions,
      pendingVerifications: pendingVerificationsCount,
      totalRevenue,
      activeSessions,
      platformHealth: "Healthy"
    })
  } catch (error) {
      console.error('Error fetching admin summary:', error)
      return NextResponse.json({
        totalUsers: 0,
        totalTherapists: 0,
        totalPartners: 0,
        totalSessions: 0,
        pendingVerifications: 0,
        totalRevenue: 0,
        activeSessions: 0,
        platformHealth: "Unknown"
      }, { status: 500 })
  }
}
