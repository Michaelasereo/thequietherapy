import { Home, Calendar, Users, DollarSign, Settings, CheckCircle2, Video, Bell } from "lucide-react"
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

// Get therapist's clients
export async function getTherapistClients(therapistId: string): Promise<TherapistClient[]> {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
      .select(`
        user_id,
        users:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('therapist_id', therapistId)
      .not('user_id', 'is', null)

    if (error) {
      console.error('Error fetching therapist clients:', error)
      return []
    }

    // Group by user_id and get unique clients
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
          total_sessions: 1
        })
      } else {
        const existing = clientMap.get(userId)!
        existing.total_sessions += 1
      }
    })

    return Array.from(clientMap.values())
  } catch (error) {
    console.error('Error fetching therapist clients:', error)
    return []
  }
}

// Get client details with session history
export async function getClientDetails(clientId: string, therapistId: string) {
  try {
    const { data, error } = await supabase
      .from('global_sessions')
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
      .order('start_time', { ascending: false })

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
      .from('global_sessions')
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
]

export const therapistDashboardBottomNavItems = [
  { name: "Settings", href: "/therapist/dashboard/settings", icon: Settings },
]

// Therapist Dashboard Summary Cards - Will be populated with real data
export const therapistSummaryCards = []

// Real data for therapist's upcoming sessions - Will be populated from database
export const therapistUpcomingSessions = []

// Real data for therapist's past sessions - Will be populated from database
export const therapistPastSessions = []

// Real data for earnings transactions - Will be populated from database
export const earningsTransactions = []

// Real data for therapist profile - Will be populated from database
export const therapistProfile = null

// Real data for therapist's clients - Will be populated from database
export const therapistClients = []
