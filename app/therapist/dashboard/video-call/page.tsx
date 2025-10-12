'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import PostSessionModal from "@/components/post-session-modal"
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Users,
  Settings,
  Play,
  Pause,
  Phone,
  FileText,
  Brain
} from "lucide-react"
import { toast } from "sonner"

interface TherapistSession {
  id: string
  patient_name: string
  patient_email: string
  start_time: string
  duration: number
  room_url?: string
  room_name?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export default function TherapistVideoCallPage() {
  const [todaysSessions, setTodaysSessions] = useState<TherapistSession[]>([])
  const [upcomingSession, setUpcomingSession] = useState<TherapistSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchSessionData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSessionData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      // Fetch today's sessions
      const todaysResponse = await fetch('/api/therapist/sessions/today')
      if (todaysResponse.ok) {
        const todaysData = await todaysResponse.json()
        setTodaysSessions(todaysData.sessions || [])
        
        // Find the next upcoming session
        const now = new Date()
        const upcoming = todaysData.sessions?.find((session: TherapistSession) => 
          new Date(session.start_time) > now && session.status === 'scheduled'
        )
        setUpcomingSession(upcoming || null)
      }
    } catch (err) {
      console.error('Error fetching session data:', err)
      setError('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const getSessionStatus = (session: TherapistSession) => {
    const sessionTime = new Date(session.start_time)
    const now = new Date()
    const sessionEnd = new Date(sessionTime.getTime() + session.duration * 60 * 1000)
    
    if (session.status === 'completed') return { status: 'completed', color: 'default' }
    if (session.status === 'cancelled') return { status: 'cancelled', color: 'destructive' }
    if (now > sessionEnd) return { status: 'missed', color: 'destructive' }
    if (now >= sessionTime) return { status: 'active', color: 'default' }
    if (now >= new Date(sessionTime.getTime() - 10 * 60 * 1000)) return { status: 'ready', color: 'default' }
    return { status: 'upcoming', color: 'secondary' }
  }

  const isSessionJoinable = (session: TherapistSession) => {
    if (!session.room_url) return false
    const sessionTime = new Date(session.start_time)
    const now = new Date()
    const tenMinutesBefore = new Date(sessionTime.getTime() - 10 * 60 * 1000)
    const sessionEnd = new Date(sessionTime.getTime() + session.duration * 60 * 1000)
    
    return now >= tenMinutesBefore && now <= sessionEnd
  }

  const joinSession = (session: TherapistSession) => {
    if (!session.room_url) {
      toast.error('Session room is not available yet')
      return
    }
    
    if (!isSessionJoinable(session)) {
      toast.error('Session is not available for joining yet')
      return
    }
    
    // Navigate to dedicated video session page
    window.location.href = `/video-session/${session.id}`
    toast.success('Opening therapy session...')
  }

  const startSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/therapist/sessions/${sessionId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Session started successfully')
        fetchSessionData() // Refresh data
      } else {
        toast.error('Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    }
  }

  const endSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/therapist/sessions/${sessionId}/end`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Session ended successfully')
        fetchSessionData() // Refresh data
      } else {
        toast.error('Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  const handleOpenPostSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSessionId(null)
    fetchSessionData() // Refresh sessions when modal closes
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Video Call Dashboard</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading your sessions...</span>
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
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Video Call Dashboard</h2>
          <Button onClick={fetchSessionData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Next Session Alert */}
      {upcomingSession && (
        <Alert className="border-brand-gold bg-brand-gold/10">
          <Video className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Next Session:</strong> {upcomingSession.patient_name} at{' '}
                {new Date(upcomingSession.start_time).toLocaleTimeString()}
              </div>
              {isSessionJoinable(upcomingSession) && (
                <Button 
                  onClick={() => joinSession(upcomingSession)}
                  size="sm"
                  className="ml-4"
                >
                  Join Now
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Sessions ({todaysSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysSessions.length > 0 ? (
            <div className="space-y-4">
              {todaysSessions.map((session) => {
                const sessionStatus = getSessionStatus(session)
                const joinable = isSessionJoinable(session)
                
                return (
                  <div key={session.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{session.patient_name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{session.patient_email}</span>
                        </div>
                      </div>
                      <Badge variant={sessionStatus.color as any}>
                        {sessionStatus.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(session.start_time).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Duration:</span>
                        <span>{session.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Room:</span>
                        <span className={session.room_url ? 'text-green-600' : 'text-red-600'}>
                          {session.room_url ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span>{session.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {joinable && session.room_url && (
                        <Button 
                          onClick={() => joinSession(session)}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          {session.status === 'in_progress' ? 'Continue Session' : 'Join Session'}
                        </Button>
                      )}
                      
                      {session.status === 'scheduled' && !joinable && (
                        <Button disabled size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-2" />
                          Available in {Math.ceil((new Date(session.start_time).getTime() - 10 * 60 * 1000 - Date.now()) / (1000 * 60))} min
                        </Button>
                      )}

                      {session.status === 'in_progress' && (
                        <Button 
                          onClick={() => endSession(session.id)}
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          End Session
                        </Button>
                      )}

                      {session.status === 'completed' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenPostSession(session.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Review Session
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/therapist/dashboard/sessions/${session.id}/feedback`}>
                              <Brain className="h-4 w-4 mr-2" />
                              View Feedback
                            </Link>
                          </Button>
                        </div>
                      )}

                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/therapist/dashboard/patients/${session.patient_email.split('@')[0]}`}>
                          <User className="h-4 w-4 mr-2" />
                          Patient Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No sessions scheduled for today</p>
              <p className="text-sm">Your scheduled sessions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/therapist/dashboard/availability">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Manage Schedule</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/therapist/dashboard/clients">
                <Users className="h-6 w-6 mb-2" />
                <span>My Patients</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/therapist/dashboard/sessions">
                <Clock className="h-6 w-6 mb-2" />
                <span>Session History</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-20 flex-col">
              <Link href="/test-video-complete-flow">
                <Video className="h-6 w-6 mb-2" />
                <span>Test Video System</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Preparation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Session Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Before Each Session:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                  Test your audio and video equipment
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                  Review patient notes and history
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                  Ensure a quiet, private environment
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                  Have session materials ready
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">During Sessions:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Maintain eye contact with the camera
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Use the recording feature for notes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Monitor patient engagement
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  End sessions on time
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}



