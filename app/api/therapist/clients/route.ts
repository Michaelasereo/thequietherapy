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
    const clientId = searchParams.get('clientId')

    console.log('📋 Clients API called with:', { therapistId, clientId })

    if (!therapistId) {
      console.error('❌ Therapist ID missing')
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    // If clientId is provided, fetch specific client details
    if (clientId) {
      // Fetch specific client data
      const { data: client, error: clientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', clientId)
        .in('user_type', ['user', 'individual']) // Support both types
        .single()

      if (clientError) throw clientError

      // Fetch sessions for this specific client with this therapist
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      // Fetch patient biodata for this client
      const { data: biodata, error: biodataError } = await supabase
        .from('patient_biodata')
        .select('*')
        .eq('user_id', clientId)
        .single()

      // Fetch medical history for this client
      const { data: medicalHistory, error: medicalError } = await supabase
        .from('patient_medical_history')
        .select('*')
        .eq('user_id', clientId)
        .eq('therapist_id', therapistId)
        .order('diagnosis_date', { ascending: false })

      // Calculate stats
      const totalSessions = sessions?.length || 0
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
      const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').length || 0
      const amountEarned = completedSessions * 5000 // ₦5,000 per session

      return NextResponse.json({
        client: {
          id: client.id,
          name: client.full_name || 'Unknown Client',
          email: client.email,
          picture: null, // No profile pictures in current schema
          lastSeen: sessions?.[0]?.created_at ? new Date(sessions[0].created_at).toLocaleDateString() : 'Never',
          totalSessions,
          completedSessions,
          upcomingSessions,
          amountEarned,
          biodata: biodata || {},
          medicalHistory: medicalHistory || []
        },
        sessions: sessions || []
      })
    }

    // Fetch all clients for this therapist
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })

    if (sessionsError) throw sessionsError

    // Get unique clients
    const uniqueClientIds = [...new Set(sessions?.map(s => s.user_id).filter(Boolean))]

    // Fetch client details for each unique client
    const clientsData = await Promise.all(
      uniqueClientIds.map(async (clientId) => {
        const { data: client, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('id', clientId)
          .in('user_type', ['user', 'individual']) // Support both types
          .single()

        if (clientError) return null

        // Get sessions for this specific client
        const clientSessions = sessions?.filter(s => s.user_id === clientId) || []
        const lastSession = clientSessions[0]
        const lastSeen = lastSession?.created_at ? new Date(lastSession.created_at).toLocaleDateString() : 'Never'

        return {
          id: client.id,
          name: client.full_name || 'Unknown Client',
          email: client.email,
          picture: null, // No profile pictures in current schema
          lastSeen,
          sessions: clientSessions.length,
          lastSessionDate: lastSession?.created_at
        }
      })
    )

    // Filter out null values and sort by last session date
    const validClients = clientsData
      .filter(Boolean)
      .sort((a, b) => {
        if (!a?.lastSessionDate && !b?.lastSessionDate) return 0
        if (!a?.lastSessionDate) return 1
        if (!b?.lastSessionDate) return -1
        return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime()
      })

    return NextResponse.json({
      clients: validClients
    })

  } catch (error: any) {
    console.error('❌ Error fetching therapist clients:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    return NextResponse.json({
      clients: [],
      error: 'Failed to fetch client data',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
