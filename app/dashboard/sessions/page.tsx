'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { 
  getUserSessions, 
  getUpcomingSessions, 
  joinSession, 
  completeSession,
  SessionData 
} from "@/lib/session-management"
import { useAuth } from '@/context/auth-context'
import SessionActionsMenu from '@/components/session-actions-menu'

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (user?.id) {
          const [allSessions, upcoming] = await Promise.all([
            getUserSessions(user.id),
            getUpcomingSessions(user.id)
          ])
          setSessions(allSessions)
          setUpcomingSessions(upcoming)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
        toast({
          title: "Error",
          description: "Failed to load sessions.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchSessions()
    } else {
      setLoading(false)
    }
  }, [user])

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

  const handleSessionUpdate = () => {
    if (user?.id) {
      getUserSessions(user.id).then(setSessions)
      getUpcomingSessions(user.id).then(setUpcomingSessions)
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
        handleSessionUpdate()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>
    }
  }

  const canJoinSession = (session: SessionData) => {
    const now = new Date()
    const sessionTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    const timeDiff = sessionTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    // Can join 5 minutes before or during the session
    return minutesDiff >= -5 && session.status === 'scheduled'
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
      <h2 className="text-2xl font-bold">My Sessions</h2>

      {/* Upcoming Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id} className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {'Therapist'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Video Session
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(session.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {session.scheduled_time} - {session.duration_minutes ? 
                            new Date(new Date(`${session.scheduled_date}T${session.scheduled_time}`).getTime() + session.duration_minutes * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                            : 'TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canJoinSession(session) && session.id && (
                        <Button 
                          onClick={() => handleJoinSession(session.id!)}
                          className="flex-1"
                        >
                          Join Session
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
                  </CardContent>
                </Card>
              ))}
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

      {/* All Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {'Therapist'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.scheduled_date)} at {session.scheduled_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <SessionActionsMenu 
                          session={session} 
                          onSessionUpdate={handleSessionUpdate}
                          userType={(user?.user_type as 'individual' | 'therapist' | 'admin') || 'individual'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No sessions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
