import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    // Fetch therapist info
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('*')
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single()

    if (therapistError) throw therapistError

    // Fetch therapist enrollment data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .eq('email', therapist.email)
      .single()

    // Fetch sessions for this therapist
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)

    if (sessionsError) throw sessionsError

    // Fetch unique clients
    const { data: clients, error: clientsError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('therapist_id', therapistId)
      .not('user_id', 'is', null)

    if (clientsError) throw clientsError

    // Get unique client count
    const uniqueClients = new Set(clients?.map(c => c.user_id)).size

    // Calculate stats
    const totalSessions = sessions?.length || 0
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
    const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').length || 0

    // Calculate earnings (₦5,000 per session)
    const earningsThisMonth = completedSessions * 5000

    return NextResponse.json({
      therapist: {
        id: therapist.id,
        name: therapist.full_name,
        email: therapist.email,
        isVerified: therapist.is_verified,
        isApproved: enrollment?.status === 'approved',
        specialization: enrollment?.specialization || [],
        licenseNumber: enrollment?.mdcn_code || '',
        hourlyRate: 5000,
        totalClients: uniqueClients,
        totalSessions,
        completedSessions,
        upcomingSessions,
        earningsThisMonth
      },
      sessions: sessions || [],
      clients: uniqueClients
    })
  } catch (error) {
    console.error('Error fetching therapist dashboard data:', error)
    return NextResponse.json({
      therapist: null,
      sessions: [],
      clients: 0
    }, { status: 500 })
  }
}
