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
import { useDashboard } from '@/context/dashboard-context'
import SessionActionsMenu from '@/components/session-actions-menu'
import PostSessionModal from '@/components/post-session-modal'
import { formatTime, formatDate, getSessionStartTime } from '@/lib/utils'
import AddToCalendarButton from '@/components/add-to-calendar-button'
import SessionDetailsModal from '@/components/session-details-modal'
// import { supabase } from "@/lib/supabase" // Removed - not used and causing WebSocket connection attempts
// import { useRealtimeData } from "@/hooks/useRealtimeData" // Disabled - causing connection errors

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { state: dashboardState, fetchSessions: refreshDashboardSessions } = useDashboard()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [realTimeUpdates, setRealTimeUpdates] = useState(0) // Disabled - realtime functionality removed
  const [isOnline, setIsOnline] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDetailsSessionId, setSelectedDetailsSessionId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

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

  // Fetch sessions data - use dashboard context for consistency
  const fetchSessions = async () => {
    try {
      if (user?.id) {
        // First try to use dashboard context data
        if (dashboardState.upcomingSessions.length > 0 || dashboardState.pastSessions.length > 0) {
          const allSessions = [...dashboardState.upcomingSessions, ...dashboardState.pastSessions]
          console.log('🔍 Using dashboard context sessions:', allSessions)
          // Convert Session[] to SessionData[] format
          const convertedSessions: SessionData[] = allSessions.map(session => ({
            id: session.id,
            user_id: user.id,
            therapist_id: '', // Not available in dashboard context
            status: session.status,
            duration: 60, // Default duration
            start_time: session.date,
            end_time: session.time,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            therapist_name: session.therapist,
            title: session.topic
          }))
          setSessions(convertedSessions)
        } else {
          // Fallback to direct API call
          const allSessions = await getUserSessions(user.id)
          console.log('🔍 Fetched sessions directly:', allSessions)
          setSessions(allSessions)
          // Refresh dashboard context
          await refreshDashboardSessions()
        }
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
  }, [user?.id]) // Remove dashboard state dependencies to prevent infinite loops

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

  const handleOpenPostSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedSessionId(sessionId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSessionId(null)
    // Refresh sessions when modal closes
    fetchSessions()
  }

  const handleOpenSessionDetails = (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedDetailsSessionId(sessionId)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedDetailsSessionId(null)
  }

  const renderSessionCard = (session: SessionData, showActions: boolean = true) => {
    const isCompletedSession = session.status === 'completed' || session.status === 'cancelled' || session.status === 'no_show';
    
    const CardWrapper = isCompletedSession ? 
      ({ children }: { children: React.ReactNode }) => (
        <div 
          key={session.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOpenPostSession(session.id!)}
        >
          {children}
        </div>
      ) : 
      ({ children }: { children: React.ReactNode }) => <div key={session.id}>{children}</div>;

    return (
      <CardWrapper>
        <Card className={`shadow-sm ${isCompletedSession ? 'border-brand-gold hover:border-brand-gold-dark' : ''}`}>
          <CardContent className="p-6">
            {isCompletedSession && (
              <div className="flex items-center justify-end mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 border-black"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenPostSession(session.id!)
                  }}
                >
                  View Session Review
                </Button>
              </div>
            )}
            {!isCompletedSession && session.status === 'scheduled' && (
              <div className="flex items-center justify-end mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenSessionDetails(session.id!)
                  }}
                >
                  View Details
                </Button>
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
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(session)}
            {/* Credit Required Badge for therapist-scheduled sessions */}
            {session.status === 'scheduled' && !session.credit_used_id && (
              <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-700 text-xs">
                💳 Credit Required
              </Badge>
            )}
          </div>
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
                  <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">AI Generated</span>
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
            {/* Add to Calendar button for upcoming sessions */}
            {session.status === 'scheduled' && (
              <AddToCalendarButton
                session={{
                  id: session.id!,
                  title: session.title || 'Therapy Session',
                  start_time: session.start_time || session.scheduled_date || '',
                  end_time: session.end_time || '',
                  therapist_name: session.therapist_name || session.therapist?.full_name,
                  therapist_email: session.therapist_email || session.therapist?.email,
                  session_url: session.daily_room_url
                }}
                variant="outline"
                size="sm"
              />
            )}
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
    <>
      <PostSessionModal 
        sessionId={selectedSessionId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onComplete={handleCloseModal}
      />
      
      <SessionDetailsModal
        sessionId={selectedDetailsSessionId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        userType="patient"
      />
      
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
            <div className="text-2xl font-bold text-gray-900">{categorizedSessions.upcoming.length}</div>
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
    </>
  )
}