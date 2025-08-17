import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export async function GET() {
  try {
    // Fetch recent user registrations
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, user_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) throw usersError

    // Fetch recent sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionsError) throw sessionsError

    // Get client names for sessions
    const clientIds = recentSessions?.map(s => s.user_id).filter(Boolean) || []
    const { data: clients } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', clientIds)

    const clientMap = new Map(clients?.map(c => [c.id, c.full_name]) || [])

    // Combine and format activities
    const activities = []

    // Add user registrations
    recentUsers?.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_registration',
        user: user.full_name || user.email,
        time: formatTimeAgo(user.created_at),
        status: 'completed'
      })
    })

    // Add session activities
    recentSessions?.forEach(session => {
      activities.push({
        id: `session_${session.id}`,
        type: 'session_completed',
        user: clientMap.get(session.user_id) || 'Unknown User',
        time: formatTimeAgo(session.created_at),
        status: session.status
      })
    })

    // Sort by time and return top 5
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json([], { status: 500 })
  }
}
