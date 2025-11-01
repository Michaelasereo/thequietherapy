'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CalendarIcon, Video, History, Loader2, FileText, Brain, Eye, EyeOff, Clock } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import PostSessionModal from "@/components/post-session-modal"
import AddToCalendarButton from "@/components/add-to-calendar-button"
import SessionDetailsModal from "@/components/session-details-modal"
// import { supabase } from "@/lib/supabase" // Removed - not used and causing WebSocket connection attempts
// import { useRealtimeData } from "@/hooks/useRealtimeData" // Disabled - causing connection errors

export default function TherapistClientSessionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([])
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("scheduled")
  const [joiningSession, setJoiningSession] = useState<string | null>(null)
  const [realTimeUpdates, setRealTimeUpdates] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDetailsSessionId, setSelectedDetailsSessionId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Fetch sessions data
  const fetchSessions = useCallback(async () => {
    if (!user?.id) {
      console.log('🔍 TherapistClientSessionsPage: No user ID, skipping fetch')
      return
    }

    try {
      console.log('🔍 TherapistClientSessionsPage: Fetching sessions for therapist:', user.id)
      setLoading(true)
      
      const response = await fetch(`/api/therapist/dashboard-data?therapistId=${user.id}`)
      const data = await response.json()
      
      console.log('🔍 TherapistClientSessionsPage: API response:', data)
      console.log('🔍 TherapistClientSessionsPage: data.data:', data.data)
      console.log('🔍 TherapistClientSessionsPage: data.data.sessions:', data.data?.sessions)
      
      if (data.success && data.data) {
        const sessions = data.data.sessions || []
        
        console.log('🔍 TherapistClientSessionsPage: Raw sessions:', sessions)
        console.log('🔍 TherapistClientSessionsPage: Sessions count:', sessions.length)
        console.log('🔍 TherapistClientSessionsPage: All session statuses:', sessions.map((s: any) => ({ id: s.id, status: s.status })))
        
        // Filter sessions by status - be more inclusive for scheduled/upcoming
        // Scheduled: any session that's not completed/cancelled and hasn't started yet
        const now = new Date()
        const scheduled = sessions.filter((s: any) => {
          const status = s.status?.toLowerCase() || ''
          const isScheduledStatus = ['scheduled', 'pending_approval', 'confirmed', 'pending'].includes(status)
          
          // Also check if session hasn't started yet (future date)
          const sessionDate = s.start_time ? new Date(s.start_time) : 
                            (s.scheduled_date && s.scheduled_time ? new Date(`${s.scheduled_date}T${s.scheduled_time}`) : null)
          const isFuture = sessionDate && sessionDate > now
          
          return isScheduledStatus || (isFuture && status !== 'completed' && status !== 'cancelled')
        })
        
        // Upcoming: in progress sessions
        const upcoming = sessions.filter((s: any) => {
          const status = s.status?.toLowerCase() || ''
          return status === 'in_progress' || status === 'in-progress'
        })
        
        // Past: completed or cancelled
        const past = sessions.filter((s: any) => {
          const status = s.status?.toLowerCase() || ''
          return status === 'completed' || status === 'cancelled' || status === 'no_show'
        })
        
        console.log('🔍 TherapistClientSessionsPage: Scheduled sessions:', scheduled.length, scheduled.map((s: any) => ({ id: s.id, status: s.status })))
        console.log('🔍 TherapistClientSessionsPage: Upcoming sessions:', upcoming.length, upcoming.map((s: any) => ({ id: s.id, status: s.status })))
        console.log('🔍 TherapistClientSessionsPage: Past sessions:', past.length, past.map((s: any) => ({ id: s.id, status: s.status })))
        
        setScheduledSessions(scheduled)
        setUpcomingSessions(upcoming)
        setPastSessions(past)
      } else {
        console.warn('🔍 TherapistClientSessionsPage: No sessions data in response')
        console.warn('🔍 TherapistClientSessionsPage: Response data:', data)
        setScheduledSessions([])
        setUpcomingSessions([])
        setPastSessions([])
      }
    } catch (error) {
      console.error('❌ TherapistClientSessionsPage: Error fetching sessions:', error)
      setScheduledSessions([])
      setUpcomingSessions([])
      setPastSessions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Initial data fetch
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Real-time data hooks disabled - causing connection errors
  // const sessionsRealtime = useRealtimeData({
  //   table: 'sessions',
  //   filter: `therapist_id=eq.${user?.id}`,
  //   onUpdate: (payload) => {
  //     console.log('🔴 Therapist sessions real-time update:', payload)
  //     setRealTimeUpdates(prev => prev + 1)
  //     fetchSessions()
  //     toast.success('Sessions updated in real-time')
  //   },
  //   onError: (error) => {
  //     console.error('❌ Therapist sessions real-time error:', error)
  //   }
  // })

  // const notesRealtime = useRealtimeData({
  //   table: 'session_notes',
  //   filter: `therapist_id=eq.${user?.id}`,
  //   onUpdate: (payload) => {
  //     console.log('🔴 Therapist session notes real-time update:', payload)
  //     setRealTimeUpdates(prev => prev + 1)
  //     fetchSessions()
  //     toast.success('Session notes updated in real-time')
  //   },
  //   onError: (error) => {
  //     console.error('❌ Therapist session notes real-time error:', error)
  //   }
  // })

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

  // Re-fetch when real-time updates occur
  useEffect(() => {
    if (realTimeUpdates > 0) {
      console.log('🔄 Real-time update triggered, re-fetching sessions')
      fetchSessions()
    }
  }, [realTimeUpdates])

  const handleJoinSession = async (sessionId: string) => {
    try {
      setJoiningSession(sessionId)
      
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join session')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Successfully joined session')
        // Navigate to the session page
        router.push(`/session/${sessionId}`)
      } else {
        throw new Error(result.error || 'Failed to join session')
      }
    } catch (error) {
      console.error('Error joining session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session'
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('Session not ready yet')) {
        toast.error('Session is not ready yet. You can join 15 minutes before the start time.')
      } else if (errorMessage.includes('video room')) {
        if (errorMessage.includes('attempts')) {
          toast.error('Unable to create video room after multiple attempts. Please contact support.')
        } else {
          toast.error('Unable to create video room. Please try again or contact support.')
        }
      } else if (errorMessage.includes('DAILY_API_KEY')) {
        toast.error('Video service configuration error. Please contact support.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setJoiningSession(null)
    }
  }

  const canJoinSession = (session: any) => {
    const now = new Date()
    const sessionTime = new Date(session.start_time || `${session.scheduled_date}T${session.scheduled_time}`)
    const timeDiff = sessionTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    // Can join 15 minutes before, during, or when session is in progress
    return (minutesDiff >= -15 && session.status === 'scheduled') || session.status === 'in_progress'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Time not available'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Time'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleNotesExpansion = (sessionId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const formatAIDate = (dateString: string) => {
    if (!dateString) return 'Not available'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOpenPostSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedSessionId(null)
    fetchSessions() // Refresh sessions when modal closes
  }, [fetchSessions])

  const handleOpenSessionDetails = useCallback((sessionId: string) => {
    console.log('🔍 Opening session details for:', sessionId)
    // Find the session in our current list to check what data we have
    const session = scheduledSessions.find(s => s.id === sessionId)
    console.log('📋 Session from list:', session)
    console.log('📋 Session users from list:', session?.users)
    
    setSelectedDetailsSessionId(sessionId)
    setIsDetailsModalOpen(true)
  }, [scheduledSessions])

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false)
    setSelectedDetailsSessionId(null)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Client Sessions</h1>
            <p className="text-muted-foreground">Manage your therapy sessions</p>
          </div>
        </div>
        
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader>
            <CardTitle>Loading Sessions...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your sessions...</p>
            </div>
          </CardContent>
        </Card>
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
        userType="therapist"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <History className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Client Sessions</h1>
              <p className="text-muted-foreground">Manage your therapy sessions</p>
            </div>
          </div>
          
          {/* Real-time Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? 'Live' : 'Offline'}
            </span>
          {realTimeUpdates > 0 && (
            <span className="text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded-full">
              {realTimeUpdates} updates
            </span>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled ({scheduledSessions.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Active ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Scheduled Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledSessions.length > 0 ? (
                <div className="space-y-4">
                  {scheduledSessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-blue-50 border border-blue-200">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div className="grid gap-0.5 flex-1">
                        <p className="font-medium">
                          {formatDate(session.start_time || session.scheduled_date)} at {formatTime(session.start_time || `${session.scheduled_date}T${session.scheduled_time}`)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Client: {session.users?.full_name || 'Unknown Client'} • {session.title || 'Follow-up Session'}
                        </p>
                        {session.complaints && (
                          <p className="text-xs text-gray-900 mt-1">
                            Complaint: {session.complaints}
                          </p>
                        )}
                        {session.notes && (
                          <p className="text-xs text-gray-600 mt-1">
                            Note: {session.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <AddToCalendarButton
                          session={{
                            id: session.id,
                            title: session.title || 'Therapy Session',
                            start_time: session.start_time || `${session.scheduled_date}T${session.scheduled_time}`,
                            end_time: session.end_time || new Date(new Date(session.start_time || `${session.scheduled_date}T${session.scheduled_time}`).getTime() + 30 * 60000).toISOString(),
                            patient_name: session.users?.full_name,
                            patient_email: session.users?.email,
                            session_url: session.daily_room_url
                          }}
                          variant="outline"
                          size="sm"
                        />
                        {canJoinSession(session) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent"
                            onClick={() => handleJoinSession(session.id)}
                            disabled={joiningSession === session.id}
                          >
                            {joiningSession === session.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Joining...
                              </>
                            ) : (
                              <>
                                <Video className="mr-2 h-4 w-4" />
                                Join Session
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSessionDetails(session.id)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No scheduled sessions.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-green-50 border border-green-200">
                      <Video className="h-6 w-6 text-green-600" />
                      <div className="grid gap-0.5">
                        <p className="font-medium">
                          {formatDate(session.start_time || session.scheduled_date)} at {formatTime(session.start_time || `${session.scheduled_date}T${session.scheduled_time}`)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Client: {session.users?.full_name || 'Unknown Client'} • Session in progress
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto bg-transparent"
                        onClick={() => handleJoinSession(session.id)}
                        disabled={joiningSession === session.id}
                      >
                        {joiningSession === session.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Join Video Call
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active sessions.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {pastSessions.length > 0 ? (
                <div className="space-y-4">
                  {pastSessions.map((session) => {
                    const isExpanded = expandedNotes.has(session.id)
                    const hasAINotes = session.soap_notes || session.ai_notes_generated
                    const hasManualNotes = session.notes
                    
                    return (
                      <div key={session.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-start gap-4">
                          <History className="h-6 w-6 text-primary mt-1" />
                          <div className="flex-1">
                            <div className="grid gap-2">
                              <p className="font-medium">
                                {formatDate(session.start_time || session.scheduled_date)} at {formatTime(session.start_time || `${session.scheduled_date}T${session.scheduled_time}`)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Client: {session.users?.full_name || 'Unknown Client'}
                              </p>
                              
                              {/* AI Notes Status */}
                              {hasAINotes && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Brain className="h-4 w-4 text-gray-900" />
                                  <span className="text-gray-900 font-medium">AI Notes Available</span>
                                  {session.ai_notes_generated_at && (
                                    <span className="text-muted-foreground">
                                      Generated: {formatAIDate(session.ai_notes_generated_at)}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Manual Notes Status */}
                              {hasManualNotes && (
                                <div className="flex items-center gap-2 text-sm">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600 font-medium">Manual Notes Available</span>
                                </div>
                              )}
                              
                              {/* Notes Toggle Button */}
                              {(hasAINotes || hasManualNotes) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleNotesExpansion(session.id)}
                                  className="w-fit"
                                >
                                  {isExpanded ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      Hide Notes
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Notes
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenPostSession(session.id)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Review Session
                                </Button>
                                
                                {session.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/therapist/dashboard/sessions/${session.id}/feedback`)}
                                    className="flex items-center gap-2"
                                  >
                                    <Brain className="h-4 w-4" />
                                    View Feedback
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No completed sessions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}