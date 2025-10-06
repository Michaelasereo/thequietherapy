import { Home, Calendar, Users, DollarSign, Settings, CheckCircle2, Video, Bell, Shield, Plus } from "lucide-react"
import { supabase } from '@/lib/supabase'

// Types for therapist data
export interface TherapistClient {
  user_id: string
  full_name: string
  email: string
  last_session_date?: string
  total_sessions: number
  avatar_url?: string
}

export interface TherapistSession {
  id: string
  session_date: string
  session_time: string
  client_name: string
  session_type: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress'
  session_link?: string
  summary?: string
  amount_earned?: number
}

export interface TherapistDashboardData {
  therapist: {
    id: string
    full_name: string
    email: string
    totalClients: number
    completedSessions: number
    totalEarnings: number
    verificationStatus: string
  }
  upcomingSessions: TherapistSession[]
  pastSessions: TherapistSession[]
  clients: TherapistClient[]
  earnings: {
    thisMonth: number
    lastMonth: number
    total: number
    transactions: Array<{
      id: string
      amount: number
      date: string
      description: string
      type: 'session' | 'bonus' | 'refund'
    }>
  }
}

// Get therapist's clients with real data
export async function getTherapistClients(therapistId: string): Promise<TherapistClient[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        user_id,
        scheduled_date,
        scheduled_time,
        users:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('therapist_id', therapistId)
      .not('user_id', 'is', null)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })

    if (error) {
      console.error('Error fetching therapist clients:', error)
      return []
    }

    // Group by user_id and get unique clients with latest session
    const clientMap = new Map<string, TherapistClient>()
    
    data?.forEach((session: any) => {
      const userId = session.user_id
      const user = session.users
      
      if (!clientMap.has(userId)) {
        clientMap.set(userId, {
          user_id: userId,
          full_name: user?.full_name || 'Unknown Client',
          email: user?.email || '',
          avatar_url: user?.avatar_url,
          last_session_date: session.start_time,
          total_sessions: 1
        })
      } else {
        const existing = clientMap.get(userId)!
        existing.total_sessions += 1
        // Update last session date if this is more recent
        if (existing.last_session_date && session.start_time > existing.last_session_date) {
          existing.last_session_date = session.start_time
        } else if (!existing.last_session_date) {
          existing.last_session_date = session.start_time
        }
      }
    })

    return Array.from(clientMap.values())
  } catch (error) {
    console.error('Error fetching therapist clients:', error)
    return []
  }
}

// Get therapist's sessions with real data
export async function getTherapistSessions(therapistId: string): Promise<{
  upcoming: TherapistSession[]
  past: TherapistSession[]
}> {
  try {
    const now = new Date().toISOString()
    
    // Get upcoming sessions
    const { data: upcomingData, error: upcomingError } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        end_time,
        session_type,
        status,
        session_url,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('therapist_id', therapistId)
      .gte('scheduled_date', now.split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    // Get past sessions
    const { data: pastData, error: pastError } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        end_time,
        session_type,
        status,
        notes,
        price,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('therapist_id', therapistId)
      .lt('scheduled_date', now.split('T')[0])
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })
      .limit(20)

    if (upcomingError || pastError) {
      console.error('Error fetching therapist sessions:', { upcomingError, pastError })
      return { upcoming: [], past: [] }
    }

    const formatSession = (session: any, isUpcoming: boolean): TherapistSession => ({
      id: session.id,
      session_date: new Date(`${session.scheduled_date}T${session.scheduled_time}`).toLocaleDateString(),
      session_time: new Date(`${session.scheduled_date}T${session.scheduled_time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      client_name: session.users?.full_name || 'Unknown Client',
      session_type: session.session_type || 'Therapy Session',
      status: session.status || 'scheduled',
      session_link: isUpcoming ? session.session_url : undefined,
      summary: !isUpcoming ? session.notes : undefined,
      amount_earned: !isUpcoming ? session.price : undefined
    })

    return {
      upcoming: upcomingData?.map(s => formatSession(s, true)) || [],
      past: pastData?.map(s => formatSession(s, false)) || []
    }
  } catch (error) {
    console.error('Error fetching therapist sessions:', error)
    return { upcoming: [], past: [] }
  }
}

// Get therapist dashboard summary data
export async function getTherapistDashboardData(therapistId: string): Promise<TherapistDashboardData | null> {
  try {
    // Get therapist profile
    const { data: therapistData, error: therapistError } = await supabase
      .from('users')
      .select('id, full_name, email, verification_status')
      .eq('id', therapistId)
      .eq('user_type', 'therapist')
      .single()

    if (therapistError || !therapistData) {
      console.error('Error fetching therapist profile:', therapistError)
      return null
    }

    // Get sessions and clients in parallel
    const [sessions, clients] = await Promise.all([
      getTherapistSessions(therapistId),
      getTherapistClients(therapistId)
    ])

    // Calculate earnings
    const completedSessions = sessions.past.filter(s => s.status === 'completed')
    const totalEarnings = completedSessions.reduce((sum, session) => sum + (session.amount_earned || 5000), 0)
    
    // Calculate this month's earnings
    const thisMonth = new Date().getMonth()
    const thisMonthSessions = completedSessions.filter(s => {
      const sessionDate = new Date(s.session_date)
      return sessionDate.getMonth() === thisMonth
    })
    const thisMonthEarnings = thisMonthSessions.reduce((sum, session) => sum + (session.amount_earned || 5000), 0)

    return {
      therapist: {
        id: therapistData.id,
        full_name: therapistData.full_name,
        email: therapistData.email,
        totalClients: clients.length,
        completedSessions: completedSessions.length,
        totalEarnings,
        verificationStatus: therapistData.verification_status || 'pending'
      },
      upcomingSessions: sessions.upcoming,
      pastSessions: sessions.past,
      clients,
      earnings: {
        thisMonth: thisMonthEarnings,
        lastMonth: totalEarnings - thisMonthEarnings, // Simplified calculation
        total: totalEarnings,
        transactions: completedSessions.map(s => ({
          id: s.id,
          amount: s.amount_earned || 5000,
          date: s.session_date,
          description: `Session with ${s.client_name}`,
          type: 'session' as const
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching therapist dashboard data:', error)
    return null
  }
}

// Get client details with session history
export async function getClientDetails(clientId: string, therapistId: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('user_id', clientId)
      .eq('therapist_id', therapistId)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })

    if (error) {
      console.error('Error fetching client details:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching client details:', error)
    return null
  }
}

// Check if therapist has access to client
export async function checkTherapistClientAccess(therapistId: string, clientId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('user_id', clientId)
      .limit(1)

    if (error) {
      console.error('Error checking therapist client access:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking therapist client access:', error)
    return false
  }
}

// Therapist Dashboard Sidebar Navigation
export const therapistDashboardSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Dashboard", href: "/therapist/dashboard", icon: Home }],
  },
  {
    label: "Management",
    items: [
      { name: "Client History", href: "/therapist/dashboard/clients", icon: Users },
      { name: "Client Sessions", href: "/therapist/dashboard/client-sessions", icon: Users },
      { name: "Earnings", href: "/therapist/dashboard/earnings", icon: DollarSign },
      { name: "Verification", href: "/therapist/dashboard/verification", icon: CheckCircle2 },
    ],
  },
  {
    label: "Meetings & Availability",
    items: [
      { name: "Create Session", href: "/therapist/dashboard/create-session", icon: Plus },
      { name: "Availability", href: "/therapist/dashboard/availability", icon: Calendar },
      { name: "Video Call", href: "/therapist/dashboard/video-call", icon: Video },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notifications", href: "/therapist/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Approve Therapists", href: "/admin/dashboard/therapists", icon: Shield },
    ],
  },
]

export const therapistDashboardBottomNavItems = [
  { name: "Settings", href: "/therapist/dashboard/settings", icon: Settings },
]

// Legacy exports for backward compatibility - these will be populated with real data
export const therapistSummaryCards = []
export const therapistUpcomingSessions = []
export const therapistPastSessions = []
export const earningsTransactions = []
export const therapistProfile = null
export const therapistClients = []
