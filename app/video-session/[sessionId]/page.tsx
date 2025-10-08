'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  MessageSquare,
  Settings,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Home,
  User,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import DailyIframe from '@daily-co/daily-js'
import DailyAudioRecorder from '@/components/daily-audio-recorder'
import SessionChat from '@/components/session-chat'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  start_time: string
  end_time: string
  duration: number
  session_type: 'video' | 'audio' | 'chat' | 'in_person'
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  session_url?: string
  room_name?: string
  recording_url?: string
  daily_room_url?: string
  daily_room_name?: string
  therapist?: {
    id: string
    full_name: string
    email: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
}

function VideoSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  
  // Initialize timer with correct value
  useEffect(() => {
    if (session && sessionTime === 0) {
      const now = new Date()
      let sessionStartTime
      if (session.start_time && session.end_time) {
        sessionStartTime = new Date(`${session.start_time}T${session.end_time}`)
      } else {
        sessionStartTime = new Date(session.start_time)
      }
      
      const THERAPY_DURATION_MS = 30 * 60 * 1000 // 30 minutes in milliseconds
      const therapyEndTime = new Date(sessionStartTime.getTime() + THERAPY_DURATION_MS)
      
      console.log('🔍 Initial Timer Setup:', {
        now: now.toISOString(),
        sessionStart: sessionStartTime.toISOString(),
        therapyEnd: therapyEndTime.toISOString(),
        sessionData: {
          start_time: session.start_time,
        scheduled_date: session.start_time,
        scheduled_time: session.end_time,
        duration_minutes: 30 // Force 30 minutes for therapy session
        }
      })
      
      if (now < sessionStartTime) {
        // WAITING: Countdown to session start
        const timeUntilStart = Math.floor((sessionStartTime.getTime() - now.getTime()) / 1000)
        setSessionTime(timeUntilStart)
        setSessionPhase('waiting')
        
        console.log('🔍 Initial Timer Setup - Waiting Phase:', {
          timeUntilStart,
          formatted: formatTime(timeUntilStart)
        })
        
      } else if (now >= sessionStartTime && now < therapyEndTime) {
        // THERAPY: Countdown from 30:00 to 00:00
        const remainingTherapyMs = therapyEndTime.getTime() - now.getTime()
        const remainingTherapySeconds = Math.floor(remainingTherapyMs / 1000)
        const correctedTime = Math.max(0, remainingTherapySeconds)
        
        console.log('🔍 Initial Timer Setup - Therapy Phase:', {
          remainingTherapyMs,
          remainingTherapySeconds,
          correctedTime,
          formatted: formatTime(correctedTime)
        })
        
        setSessionTime(correctedTime)
        setSessionPhase('therapy')
      } else {
        setSessionTime(0)
        setSessionPhase('ended')
      }
    }
  }, [session])
  const [participants, setParticipants] = useState<any[]>([])
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: string}>>([])
  const [newMessage, setNewMessage] = useState('')
  
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null)
  const [sessionPhase, setSessionPhase] = useState<'waiting' | 'therapy' | 'buffer' | 'ended'>('waiting')
  
  // Daily.co call object and frame ref for recording
  const [callObject, setCallObject] = useState<any>(null)
  const callFrameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessionData()
  }, [sessionId])

  // Initialize Daily.co call object for recording
  useEffect(() => {
    if (!session?.daily_room_url || !callFrameRef.current || sessionPhase !== 'therapy') return
    
    console.log('🎥 Initializing Daily.co call object for recording...')
    
    // Create Daily.co call frame
    const daily = DailyIframe.createFrame(callFrameRef.current, {
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '8px'
      }
    })
    
    // Join the call
    daily.join({ url: session.daily_room_url })
      .then(() => {
        console.log('✅ Joined Daily.co call')
        setCallObject(daily)
        setIsConnected(true)
        setIsConnecting(false)
      })
      .catch((error) => {
        console.error('❌ Failed to join call:', error)
        setError('Failed to join video call')
        setIsConnecting(false)
      })
    
    // Cleanup on unmount or phase change
    return () => {
      console.log('🧹 Cleaning up Daily.co call object')
      if (daily) {
        daily.leave().catch(console.error)
        daily.destroy().catch(console.error)
      }
      setCallObject(null)
    }
  }, [session?.daily_room_url, sessionPhase])

  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      const now = new Date()
      
      // Get session start time consistently
      let sessionStartTime
      if (session.start_time && session.end_time) {
        sessionStartTime = new Date(`${session.start_time}T${session.end_time}`)
      } else {
        sessionStartTime = new Date(session.start_time)
      }
      
      // Define durations in milliseconds (more reliable)
      const THERAPY_DURATION_MS = 30 * 60 * 1000 // 30 minutes in ms
      const BUFFER_DURATION_MS = 30 * 60 * 1000  // 30 minutes in ms
      const TOTAL_DURATION_MS = THERAPY_DURATION_MS + BUFFER_DURATION_MS
      
      const therapyEndTime = new Date(sessionStartTime.getTime() + THERAPY_DURATION_MS)
      const bufferEndTime = new Date(sessionStartTime.getTime() + TOTAL_DURATION_MS)
      
      if (now < sessionStartTime) {
        // WAITING: Countdown to session start (positive time until start)
        const timeUntilStart = Math.floor((sessionStartTime.getTime() - now.getTime()) / 1000)
        setSessionTime(timeUntilStart) // Positive time until start
        setSessionPhase('waiting')
        
      } else if (now >= sessionStartTime && now < therapyEndTime) {
        // THERAPY: Countdown from 30:00 to 00:00
        const remainingTherapyMs = therapyEndTime.getTime() - now.getTime()
        const remainingTherapySeconds = Math.floor(remainingTherapyMs / 1000)
        setSessionTime(Math.max(0, remainingTherapySeconds))
        setSessionPhase('therapy')
        
      } else if (now >= therapyEndTime && now < bufferEndTime) {
        // BUFFER: Countdown from 30:00 to 00:00  
        const remainingBufferMs = bufferEndTime.getTime() - now.getTime()
        const remainingBufferSeconds = Math.floor(remainingBufferMs / 1000)
        setSessionTime(Math.max(0, remainingBufferSeconds))
        setSessionPhase('buffer')
        
      } else {
        // ENDED
        setSessionTime(0)
        setSessionPhase('ended')
      }
    }, 1000)
    
    setTimerRef(interval)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    return () => {
      if (timerRef) {
        clearInterval(timerRef)
      }
    }
  }, [timerRef])

  // Control Daily.co video call based on session phase
  useEffect(() => {
    const iframe = document.getElementById('daily-iframe') as HTMLIFrameElement
    if (!iframe) return

    // Only show video during therapy phase when connected
    const shouldShowVideo = sessionPhase === 'therapy' && isConnected
    
    iframe.style.display = shouldShowVideo ? 'block' : 'none'
    
    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Video Control:', {
        sessionPhase,
        isConnected,
        shouldShowVideo
      })
    }
  }, [sessionPhase, isConnected])

  // Add this useEffect to debug timer states
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Timer Debug:', {
        sessionPhase,
        sessionTime: formatTime(sessionTime),
        rawSessionTime: sessionTime,
        timestamp: new Date().toISOString()
      })
    }
    
    // Force fix: If timer shows 60 minutes, reset to 30
    if (sessionPhase === 'therapy' && sessionTime > 30 * 60) {
      console.log('🔧 EMERGENCY FIX: Resetting 60-minute timer to 30 minutes')
      setSessionTime(30 * 60)
    } else if (sessionPhase === 'buffer' && sessionTime > 30 * 60) {
      console.log('🔧 EMERGENCY FIX: Resetting 60-minute buffer to 30 minutes')
      setSessionTime(30 * 60)
    }
  }, [sessionPhase, sessionTime])

  const validateAndRefreshAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Auth error:', error)
        throw new Error('Authentication failed')
      }
      
      if (!session) {
        console.log('🔄 No session, redirecting to login...')
        router.push('/auth/login')
        return false
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('🔄 Token expired, refreshing...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('❌ Token refresh failed:', refreshError)
          router.push('/auth/login')
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('❌ Auth validation failed:', error)
      router.push('/auth/login')
      return false
    }
  }

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      // Validate auth first
      const isAuthenticated = await validateAndRefreshAuth()
      if (!isAuthenticated) return

      console.log('🔄 Fetching session details...')
      
      // Try multiple endpoints with proper error handling
      const endpoints = [
        `/api/sessions/${sessionId}`,
        '/api/sessions/upcoming',
        '/api/sessions/history'
      ]
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Session data fetched from:', endpoint)
            
            // Handle different response formats
            if (data.success && data.data) {
              setSession(data.data.session || data.data)
            } else if (data.sessions && data.sessions.length > 0) {
              // Find the specific session
              const foundSession = data.sessions.find((s: any) => s.id === sessionId)
              if (foundSession) {
                setSession(foundSession)
              }
            }
            return
          }
          
          if (response.status === 401) {
            console.log('🔄 401 error, refreshing auth...')
            await validateAndRefreshAuth()
            continue
          }
          
          console.log(`❌ ${endpoint} failed with status:`, response.status)
        } catch (error) {
          console.error(`❌ ${endpoint} error:`, error)
          continue
        }
      }
      
      setError('All session endpoints failed')
    } catch (err) {
      console.error('Error fetching session:', err)
      setError('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = async () => {
    if (!session) return
    
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setIsConnected(true)
          setIsConnecting(false)
          toast.success('Connected to session')
        } else {
          setError(data.error || 'Failed to join session')
          setIsConnecting(false)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to join session')
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('Error joining session:', error)
      setError('Failed to join session')
      setIsConnecting(false)
    }
  }

  const leaveSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST'
      })

      if (response.ok) {
        setIsConnected(false)
        toast.success('Left session')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error leaving session:', error)
      toast.error('Failed to leave session')
    }
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    // Send message to iframe to toggle video
    const iframe = document.getElementById('daily-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.contentWindow?.postMessage({
        type: 'toggle-video',
        enabled: !isVideoOn
      }, '*')
    }
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
    // Send message to iframe to toggle audio
    const iframe = document.getElementById('daily-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.contentWindow?.postMessage({
        type: 'toggle-audio',
        enabled: !isAudioOn
      }, '*')
    }
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    // Send message to iframe to toggle screen share
    const iframe = document.getElementById('daily-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.contentWindow?.postMessage({
        type: 'toggle-screenshare',
        enabled: !isScreenSharing
      }, '*')
    }
  }

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: session?.user?.full_name || 'You',
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }


  const formatTime = (seconds: number) => {
    // Force fix: Never show more than 30 minutes for therapy/buffer phases
    let displaySeconds = seconds
    
    if (sessionPhase === 'therapy' && seconds > 30 * 60) {
      displaySeconds = 30 * 60
      console.log('🔧 FORCE FIX: Capped therapy time from', seconds, 'to', displaySeconds)
    } else if (sessionPhase === 'buffer' && seconds > 30 * 60) {
      displaySeconds = 30 * 60
      console.log('🔧 FORCE FIX: Capped buffer time from', seconds, 'to', displaySeconds)
    }
    
    const absSeconds = Math.abs(displaySeconds)
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    
    const sign = displaySeconds < 0 ? '-' : ''
    const result = `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    
    // Debug the final result
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 formatTime:', {
        inputSeconds: seconds,
        displaySeconds: displaySeconds,
        sessionPhase: sessionPhase,
        result: result
      })
    }
    
    return result
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Session Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Session not found'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Navigation */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm">
              {sessionPhase === 'waiting' ? `Starts in ${formatTime(sessionTime)}` :
               sessionPhase === 'therapy' ? `Therapy: ${formatTime(sessionTime)} remaining` :
               sessionPhase === 'buffer' ? `Buffer period: ${formatTime(sessionTime)} remaining` :
               'Session ended'}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-1">
                  Debug: sessionTime={sessionTime}, phase={sessionPhase}
                </div>
              )}
            </span>
          </div>
          
          <div className="text-sm text-gray-300">
            Session #{sessionId}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-gray-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-white hover:bg-gray-700"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className={`flex-1 relative ${showChat ? 'mr-80' : ''}`}>
          {!isConnected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-gray-700 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Video className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Ready to Start Session</h2>
                
                {/* Session Info */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Therapist:</span>
                      <span className="text-sm font-medium text-white">
                        {session.therapist?.full_name || 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Therapy Duration:</span>
                      <span className="text-sm text-white">30 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Buffer Period:</span>
                      <span className="text-sm text-white">30 minutes (prevents double booking)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Status:</span>
                      <Badge variant="secondary" className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">
                  {sessionPhase === 'waiting' ? 
                    `Session starts at ${new Date(session.start_time).toLocaleTimeString()}. You can join 15 minutes before, but the countdown will only start at the exact scheduled time.` :
                    `Click the button below to start your therapy session with ${session.therapist?.full_name || 'your therapist'}`
                  }
                </p>
                <Button 
                  onClick={joinSession} 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Start Session'}
                </Button>
              </div>
            </div>
          ) : sessionPhase === 'buffer' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-blue-700 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-blue-300" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Therapy Session Ended</h2>
                <p className="text-gray-400 mb-6">
                  The 30-minute therapy session has ended at 2:30 AM. The video call is now closed.
                </p>
                <div className="bg-blue-800 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-200">
                    <strong>Buffer Period:</strong> 30 minutes to prevent double booking of the next time slot
                  </div>
                </div>
                <Button 
                  onClick={leaveSession} 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Leave Session
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Call with Daily.co SDK */}
              {sessionPhase === 'therapy' ? (
                <div className="relative w-full h-full">
                  {/* Daily.co call frame container */}
                  <div ref={callFrameRef} className="w-full h-full" />
                  
                  {/* Recording controls overlay */}
                  {callObject && (
                    <div className="absolute top-4 right-4 z-10">
                      <DailyAudioRecorder
                        callObject={callObject}
                        sessionId={sessionId}
                        onTranscriptionComplete={async (transcript) => {
                          console.log('✅ Transcription complete:', transcript.substring(0, 100) + '...')
                          toast.success('Session recorded and transcribed!')
                          
                          // Trigger SOAP notes generation
                          try {
                            const response = await fetch('/api/sessions/complete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId })
                            })
                            
                            if (response.ok) {
                              const result = await response.json()
                              if (result.success) {
                                toast.success('AI SOAP notes generated successfully!')
                                // Redirect to post-session page after a short delay
                                setTimeout(() => {
                                  router.push(`/sessions/${sessionId}/post-session`)
                                }, 2000)
                              } else {
                                toast.warning('Session completed but SOAP notes generation had issues')
                              }
                            }
                          } catch (error) {
                            console.error('Failed to generate AI notes:', error)
                            toast.error('Failed to generate AI notes')
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="bg-gray-700 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Video className="h-10 w-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-4">
                      {sessionPhase === 'waiting' ? 'Video Call Not Available Yet' : 'Video Call Ended'}
                    </h2>
                    <p className="text-gray-400 mb-6">
                      {sessionPhase === 'waiting' 
                        ? 'Video call will be available at the scheduled session time. Timer countdown starts at the exact scheduled time.'
                        : 'The therapy session has ended. Video call is no longer available.'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {/* Call Controls - Only show during therapy phase */}
              {sessionPhase === 'therapy' && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-4 bg-gray-800/90 backdrop-blur-sm rounded-full px-6 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAudio}
                    className={`rounded-full p-3 ${isAudioOn ? 'bg-gray-600' : 'bg-red-600'}`}
                  >
                    {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVideo}
                    className={`rounded-full p-3 ${isVideoOn ? 'bg-gray-600' : 'bg-red-600'}`}
                  >
                    {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleScreenShare}
                    className={`rounded-full p-3 ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={leaveSession}
                    className="rounded-full p-3 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              )}
            </>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && session && user && (
          <div className="w-80 bg-white border-l border-gray-200">
            <SessionChat
              sessionId={sessionId}
              currentUserId={user.id}
              currentUserName={user.full_name || 'User'}
              userType={user.id === session.therapist_id ? 'therapist' : 'patient'}
              isActive={sessionPhase === 'therapy' && isConnected}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function VideoSessionPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <VideoSessionPage />
    </ErrorBoundary>
  )
}
