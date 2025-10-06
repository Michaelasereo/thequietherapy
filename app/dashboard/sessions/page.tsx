'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Loader2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { 
  getUserSessions, 
  joinSession, 
  completeSession,
  SessionData 
} from "@/lib/session-management"
import { useAuth } from '@/context/auth-context'
import SessionActionsMenu from '@/components/session-actions-menu'
import { formatTime, formatDate, getSessionStartTime } from '@/lib/utils'
// import { supabase } from "@/lib/supabase" // Removed - not used and causing WebSocket connection attempts
// import { useRealtimeData } from "@/hooks/useRealtimeData" // Disabled - causing connection errors

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [realTimeUpdates, setRealTimeUpdates] = useState(0) // Disabled - realtime functionality removed
  const [isOnline, setIsOnline] = useState(true)

  // Categorize sessions by status and time
  const categorizedSessions = {
    upcoming: sessions.filter(s => {
      const now = new Date()
      const sessionTime = getSessionStartTime(s)
      const sessionEndTime = new Date(sessionTime.getTime() + ((s.duration || 60) * 60 * 1000))
      return s.status === 'scheduled' && sessionTime > now && sessionEndTime > now
    }),
    inProgress: sessions.filter(s => s.status === 'in_progress'),
    completed: sessions.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show'),
    ended: sessions.filter(s => {
      const now = new Date()
      const sessionTime = getSessionStartTime(s)
      const sessionEndTime = new Date(sessionTime.getTime() + ((s.duration || 60) * 60 * 1000))
      return (s.status === 'scheduled' || s.status === 'in_progress') && sessionEndTime < now
    })
  }

  // Fetch sessions data
  const fetchSessions = async () => {
    try {
      if (user?.id) {
        const allSessions = await getUserSessions(user.id)
        console.log('🔍 Fetched all sessions:', allSessions)
        setSessions(allSessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setSessions([])
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchSessions()
    } else {
      setLoading(false)
    }
  }, [user])

  // Real-time updates disabled - using polling instead
  useEffect(() => {
    if (!user?.id) return;
    
    // Poll for updates every 30 seconds instead of real-time
    const interval = setInterval(() => {
      fetchSessions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Session notes updates handled by main polling interval

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      fetchSessions()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Real-time updates disabled - removed useEffect for realtime updates

  const handleJoinSession = async (sessionId: string) => {
    try {
      const result = await joinSession(sessionId, user?.id || '')
      if (result.success) {
        toast({
          title: "Joining Session",
          description: "Redirecting to video call...",
        })
        // Redirect to video call page
        router.push(`/session/${sessionId}`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to join session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error joining session:', error)
      toast({
        title: "Error",
        description: "Failed to join session.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const result = await completeSession(sessionId)
      if (result.success) {
        toast({
          title: "Session Completed",
          description: "Session has been marked as completed.",
        })
        // Refresh sessions
        const allSessions = await getUserSessions(user?.id || '')
        setSessions(allSessions)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to complete session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error completing session:', error)
      toast({
        title: "Error",
        description: "Failed to complete session.",
        variant: "destructive",
      })
    }
  }

  const handleSessionUpdate = async () => {
    // Refresh sessions after update
    try {
      const allSessions = await getUserSessions(user?.id || '')
      setSessions(allSessions)
    } catch (error) {
      console.error('Error refreshing sessions:', error)
    }
  }

  const getStatusBadge = (session: SessionData) => {
    const now = new Date()
    const sessionTime = getSessionStartTime(session)
    const sessionEndTime = new Date(sessionTime.getTime() + ((session.duration || 60) * 60 * 1000))
    
    // Check if session has ended but status hasn't been updated
    if ((session.status === 'scheduled' || session.status === 'in_progress') && sessionEndTime < now) {
      return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Ended</Badge>
    }
    
    switch (session.status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>
      default:
        return <Badge variant="secondary">{session.status || 'Unknown'}</Badge>
    }
  }

  const canJoinSession = (session: SessionData) => {
    const now = new Date()
    const sessionTime = getSessionStartTime(session)
    const sessionEndTime = new Date(sessionTime.getTime() + ((session.duration || 60) * 60 * 1000))
    const timeDiff = sessionTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    // Cannot join if session has ended
    if (sessionEndTime < now) {
      return false
    }
    
    // Can join 15 minutes before, during, or when session is in progress
    return (minutesDiff >= -15 && session.status === 'scheduled') || session.status === 'in_progress'
  }

  const renderSessionCard = (session: SessionData, showActions: boolean = true) => {
    const isCompletedSession = session.status === 'completed' || session.status === 'cancelled' || session.status === 'no_show';
    
    const CardWrapper = isCompletedSession ? 
      ({ children }: { children: React.ReactNode }) => (
        <div 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/sessions/${session.id}/post-session`)}
        >
          {children}
        </div>
      ) : 
      ({ children }: { children: React.ReactNode }) => <>{children}</>;

    return (
      <CardWrapper>
        <Card key={session.id} className={`shadow-sm ${isCompletedSession ? 'border-blue-200 hover:border-blue-300' : ''}`}>
          <CardContent className="p-6">
            {isCompletedSession && (
              <div className="flex items-center justify-end mb-2">
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  <span>Click to view details</span>
                </div>
              </div>
            )}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold">
                {session.therapist_name || session.therapist?.full_name || 'Therapist'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {session.title || `${session.session_type || 'Video'} Session`}
              </p>
            </div>
          </div>
          {getStatusBadge(session)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(session.start_time || session.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {formatTime(session.start_time || session.scheduled_time)} - {formatTime(session.end_time)}
            </span>
          </div>
        </div>

        {/* Session Notes Display for Completed Sessions */}
        {session.status === 'completed' && session.session_notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Session Notes</h4>
            {session.session_notes.soap_notes && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">AI Generated</span>
                  {session.session_notes.ai_notes_generated_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(session.session_notes.ai_notes_generated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {session.session_notes.soap_notes}
                  </pre>
                </div>
              </div>
            )}
            {session.session_notes.notes && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Manual Notes</span>
                </div>
                <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                  <p>{session.session_notes.notes}</p>
                </div>
              </div>
            )}
            {!session.session_notes.soap_notes && !session.session_notes.notes && (
              <p className="text-sm text-gray-500 italic">No session notes available</p>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {canJoinSession(session) && session.id && (
              <Button 
                onClick={() => handleJoinSession(session.id!)}
                className="flex-1"
              >
                {session.status === 'in_progress' ? 'Join Video Call' : 'Join Session'}
              </Button>
            )}
            {session.status === 'in_progress' && session.id && (
              <Button 
                onClick={() => handleCompleteSession(session.id!)}
                variant="outline"
                className="flex-1"
              >
                Complete Session
              </Button>
            )}
            <SessionActionsMenu 
              session={session} 
              onSessionUpdate={handleSessionUpdate}
              userType={(user?.user_type as 'individual' | 'therapist' | 'admin') || 'individual'}
            />
          </div>
        )}
          </CardContent>
        </Card>
      </CardWrapper>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Sessions</h2>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sessions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Sessions</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total: {sessions.length}</span>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{categorizedSessions.upcoming.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{categorizedSessions.inProgress.length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{categorizedSessions.ended.length}</div>
            <div className="text-sm text-muted-foreground">Ended</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{categorizedSessions.completed.length}</div>
            <div className="text-sm text-muted-foreground">Finished</div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Sessions */}
      {categorizedSessions.inProgress.length > 0 && (
        <Card className="shadow-sm border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Sessions In Progress ({categorizedSessions.inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorizedSessions.inProgress.map(session => renderSessionCard(session))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions ({categorizedSessions.upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categorizedSessions.upcoming.length > 0 ? (
            <div className="space-y-4">
              {categorizedSessions.upcoming.map(session => renderSessionCard(session))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming sessions</p>
              <p className="text-sm">Book a session to get started</p>
              <Button 
                onClick={() => router.push('/dashboard/book')}
                className="mt-4"
              >
                Book Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions That Have Ended */}
      {categorizedSessions.ended.length > 0 && (
        <Card className="shadow-sm border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Sessions That Have Ended ({categorizedSessions.ended.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">These sessions have passed their scheduled end time</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorizedSessions.ended.map(session => renderSessionCard(session, false))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Sessions */}
      {categorizedSessions.completed.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Finished Sessions ({categorizedSessions.completed.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Completed, cancelled, or no-show sessions - Click any session to view detailed notes</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorizedSessions.completed.map(session => renderSessionCard(session, false))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* No sessions message */}
      {sessions.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
          <p className="text-sm mb-4">Book your first session to get started with therapy</p>
          <Button 
            onClick={() => router.push('/dashboard/book')}
            size="lg"
          >
            Book Your First Session
          </Button>
        </div>
      )}
    </div>
  )
}