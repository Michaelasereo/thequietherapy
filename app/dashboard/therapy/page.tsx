'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Video, Calendar, Clock, User, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from '@/context/auth-context'
import { getUserSessions, getUpcomingSessions } from "@/lib/session-management"
import PendingSessionApproval from "@/components/pending-session-approval"

interface Session {
  id: string
  therapist_name?: string
  therapist_email?: string
  start_time: string
  duration: number
  room_url?: string
  room_name?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export default function GoToTherapyPage() {
  const { user } = useAuth()
  const [upcomingSession, setUpcomingSession] = useState<Session | null>(null)
  const [sessionHistory, setSessionHistory] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSessionData()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSessionData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch upcoming sessions
      const upcomingSessions = await getUpcomingSessions(user.id)
      if (upcomingSessions && upcomingSessions.length > 0) {
        // Filter out completed or already ended sessions
        const now = new Date()
        const candidates = upcomingSessions.filter((s: any) => {
          const status = s.status
          const start = new Date(s.start_time || s.scheduled_date || s.created_at)
          const durationMin = s.duration || s.duration_minutes || 60
          const end = new Date(start.getTime() + durationMin * 60 * 1000)
          const notEnded = end > now
          const isUpcomingLike = ['scheduled', 'in_progress', 'confirmed', 'pending_approval'].includes(status)
          return isUpcomingLike && notEnded
        })

        // Choose the nearest one
        candidates.sort((a: any, b: any) => new Date(a.start_time || a.scheduled_date || a.created_at).getTime() - new Date(b.start_time || b.scheduled_date || b.created_at).getTime())

        const sessionData = candidates[0]
        if (sessionData) {
          setUpcomingSession({
            id: sessionData.id,
            therapist_name: sessionData.therapist_name || sessionData.therapist?.full_name,
            therapist_email: sessionData.therapist_email || sessionData.therapist?.email,
            start_time: sessionData.start_time || sessionData.scheduled_date || sessionData.created_at,
            duration: sessionData.duration || sessionData.duration_minutes || 60,
            room_url: sessionData.session_url || sessionData.daily_room_url,
            room_name: sessionData.room_name || sessionData.daily_room_name,
            status: sessionData.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
            notes: sessionData.notes
          })
        } else {
          setUpcomingSession(null)
        }
      } else {
        setUpcomingSession(null)
      }
      
      // Fetch all sessions and filter for history
      const allSessions = await getUserSessions(user.id)
      const completedSessions = allSessions
        .filter(s => s.status === 'completed' || s.status === 'cancelled')
        .slice(0, 5) // Get last 5 sessions
        .map(s => ({
          id: s.id,
          therapist_name: s.therapist_name || s.therapist?.full_name || 'Unknown Therapist',
          therapist_email: s.therapist_email || s.therapist?.email || '',
          start_time: s.start_time || s.scheduled_date || s.created_at,
          duration: s.duration || 60,
          room_url: s.session_url,
          room_name: s.room_name,
          status: s.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
          notes: s.notes
        }))
      
      setSessionHistory(completedSessions)
    } catch (err) {
      console.error('Error fetching session data:', err)
      setError('Failed to load session data')
      toast({
        title: "Error",
        description: "Failed to load session data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isSessionAvailable = (session: Session) => {
    const sessionTime = new Date(session.start_time)
    const now = new Date()
    const tenMinutesBefore = new Date(sessionTime.getTime() - 10 * 60 * 1000)
    const sessionEnd = new Date(sessionTime.getTime() + session.duration * 60 * 1000)
    
    return now >= tenMinutesBefore && now <= sessionEnd
  }

  const getSessionStatus = (session: Session) => {
    const sessionTime = new Date(session.start_time)
    const now = new Date()
    const sessionEnd = new Date(sessionTime.getTime() + session.duration * 60 * 1000)
    
    if (session.status === 'completed') return 'completed'
    if (session.status === 'cancelled') return 'cancelled'
    if (now > sessionEnd) return 'missed'
    if (now >= sessionTime) return 'active'
    if (now >= new Date(sessionTime.getTime() - 10 * 60 * 1000)) return 'ready'
    return 'upcoming'
  }

  const joinSession = (session: Session) => {
    if (!isSessionAvailable(session)) {
      toast({
        title: "Session Not Available",
        description: "Session is not available for joining yet",
        variant: "destructive",
      })
      return
    }
    
    // Navigate to dedicated video session page
    window.location.href = `/video-session/${session.id}`
    toast({
      title: "Opening Session",
      description: "Opening therapy session...",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Go to Therapy</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading your sessions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Go to Therapy</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upcoming Session */}
      {upcomingSession ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Your Next Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Therapist:</span>
                  <span>{upcomingSession.therapist_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span>{new Date(upcomingSession.start_time).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Time:</span>
                  <span>{new Date(upcomingSession.start_time).toLocaleTimeString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Duration:</span>
                  <span>{upcomingSession.duration} minutes</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={getSessionStatus(upcomingSession) === 'ready' ? 'default' : 'secondary'}>
                    {getSessionStatus(upcomingSession)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                {upcomingSession.room_url ? (
                  <div className="space-y-3">
                    {isSessionAvailable(upcomingSession) ? (
                      <Button 
                        onClick={() => joinSession(upcomingSession)}
                        size="lg" 
                        className="w-full"
                      >
                        <Video className="mr-2 h-5 w-5" />
                        Join Session Now
                      </Button>
                    ) : (
                      <Button disabled size="lg" className="w-full">
                        <Clock className="mr-2 h-5 w-5" />
                        Session Available in {Math.ceil((new Date(upcomingSession.start_time).getTime() - 10 * 60 * 1000 - Date.now()) / (1000 * 60))} min
                      </Button>
                    )}
                    
                    <p className="text-sm text-gray-600 text-center">
                      Session will be available 10 minutes before the scheduled time
                    </p>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Session room is being prepared. Please check back closer to your appointment time.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Session Preparation */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Session Preparation Checklist
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Test your microphone and camera beforehand
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Find a quiet, private space for your session
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Ensure you have a stable internet connection
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Close unnecessary applications to improve performance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Have a glass of water nearby
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle className="text-2xl">No Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You don't have any scheduled therapy sessions at the moment.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/book">
                <Calendar className="mr-2 h-5 w-5" />
                Book a Session
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionHistory.length > 0 ? (
            <div className="space-y-3">
              {sessionHistory.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{session.therapist_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        session.status === 'completed' ? 'default' : 
                        session.status === 'cancelled' ? 'destructive' : 'secondary'
                      }
                    >
                      {session.status}
                    </Badge>
                    {session.status === 'completed' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/sessions">
                    View All Sessions
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No session history yet</p>
              <p className="text-sm">Your completed sessions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-2">
          <p>• Your session link is unique to your appointment. Do not share it with others.</p>
          <p>• If you experience technical difficulties, please contact support immediately.</p>
          <p>• Sessions typically start on time. Please be ready a few minutes beforehand.</p>
          <p>• All sessions are recorded for quality assurance and note-taking purposes.</p>
          <p>• You can join the session up to 10 minutes before the scheduled time.</p>
        </CardContent>
      </Card>
    </div>
  )
}
