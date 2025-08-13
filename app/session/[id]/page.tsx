'use client';

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, PhoneOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getSessionById, completeSession, SessionData } from "@/lib/session-management"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSessionById(sessionId)
        if (sessionData) {
          setSession(sessionData)
        } else {
          toast({
            title: "Error",
            description: "Session not found.",
            variant: "destructive",
          })
          router.push('/dashboard/sessions')
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        toast({
          title: "Error",
          description: "Failed to load session.",
          variant: "destructive",
        })
        router.push('/dashboard/sessions')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isInCall])

  const handleStartCall = () => {
    setIsInCall(true)
    toast({
      title: "Call Started",
      description: "You are now in the therapy session.",
    })
  }

  const handleEndCall = async () => {
    setIsInCall(false)
    
    try {
      // Complete the session
      const success = await completeSession(sessionId)
      if (success) {
        toast({
          title: "Session Completed",
          description: "Your therapy session has been completed.",
        })
        
        // Simulate therapist adding session notes and medical history
        setTimeout(() => {
          toast({
            title: "Session Notes Added",
            description: "Therapist has added session notes and updated your medical history.",
          })
        }, 2000)
        
        // Redirect back to sessions after a delay
        setTimeout(() => {
          router.push('/dashboard/sessions')
        }, 3000)
      } else {
        toast({
          title: "Error",
          description: "Failed to complete session.",
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeString = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading session...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <Button onClick={() => router.push('/dashboard/sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Session Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Therapy Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(session.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatTimeString(session.start_time)} - {formatTimeString(session.end_time)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="font-medium">{'Therapist'}</p>
              <p className="text-sm text-muted-foreground">{session.session_type} Session</p>
            </div>
          </CardContent>
        </Card>

        {/* Video Call Interface */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Video Call</CardTitle>
          </CardHeader>
          <CardContent>
            {!isInCall ? (
              <div className="text-center py-12">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Start Session</h3>
                <p className="text-muted-foreground mb-6">
                  Click the button below to start your therapy session with your therapist.
                </p>
                <Button onClick={handleStartCall} size="lg">
                  <Phone className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <PhoneOff className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Session in Progress</h3>
                <div className="text-2xl font-mono mb-4">{formatTime(callDuration)}</div>
                <p className="text-muted-foreground mb-6">
                  Your therapy session is currently active. Click below to end the session when you're done.
                </p>
                <Button onClick={handleEndCall} variant="destructive" size="lg">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isInCall ? "default" : "secondary"}>
                {isInCall ? "In Progress" : "Ready"}
              </Badge>
              {isInCall && (
                <span className="text-sm text-muted-foreground">
                  Duration: {formatTime(callDuration)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
