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
  FileText,
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
import SessionNotesPanel from '@/components/session-notes-panel'
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
  meeting_token?: string
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
  const { user, userType } = useAuth()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [meetingToken, setMeetingToken] = useState<string | null>(null)
  
  // Helper function to get dashboard URL based on user type
  const getDashboardUrl = () => {
    switch (userType) {
      case 'therapist':
        return '/therapist/dashboard'
      case 'partner':
        return '/partner/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/dashboard'
    }
  }
  
  // Initialize timer with correct value
  useEffect(() => {
    if (session && sessionTime === 0) {
      const now = new Date()
      let sessionStartTime: Date | null = null
      
      // Try different date formats from session data
      if (session.start_time) {
        sessionStartTime = new Date(session.start_time)
      } else if ((session as any).scheduled_date && (session as any).scheduled_time) {
        // Handle scheduled_date + scheduled_time format
        const dateStr = `${(session as any).scheduled_date}T${(session as any).scheduled_time}`
        sessionStartTime = new Date(dateStr)
      } else if ((session as any).scheduled_date) {
        sessionStartTime = new Date((session as any).scheduled_date)
      }
      
      // Validate the date before using it
      if (!sessionStartTime || isNaN(sessionStartTime.getTime())) {
        console.error('❌ Invalid session start time:', {
          start_time: session.start_time,
          scheduled_date: (session as any).scheduled_date,
          scheduled_time: (session as any).scheduled_time
        })
        setSessionTime(0)
        setSessionPhase('ended')
        return
      }
      
      const THERAPY_DURATION_MS = 30 * 60 * 1000 // 30 minutes in milliseconds
      const therapyEndTime = new Date(sessionStartTime.getTime() + THERAPY_DURATION_MS)
      
      // Validate end time
      if (isNaN(therapyEndTime.getTime())) {
        console.error('❌ Invalid therapy end time')
        setSessionTime(0)
        setSessionPhase('ended')
        return
      }
      
      console.log('🔍 Initial Timer Setup:', {
        now: now.toISOString(),
        sessionStart: sessionStartTime.toISOString(),
        therapyEnd: therapyEndTime.toISOString(),
        sessionData: {
          start_time: session.start_time,
          scheduled_date: (session as any).scheduled_date,
          scheduled_time: (session as any).scheduled_time,
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
  const [showNotes, setShowNotes] = useState(false)
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
    console.log('🔍 Meeting token available:', !!meetingToken, 'Room URL:', session.daily_room_url)
    
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
    
    // Join the call with token if available
    const joinConfig: any = { url: session.daily_room_url }
    if (meetingToken || session.meeting_token) {
      joinConfig.token = meetingToken || session.meeting_token
      console.log('✅ Using meeting token for authentication')
    } else {
      console.warn('⚠️ No meeting token available - joining without token')
    }
    
    daily.join(joinConfig)
      .then(() => {
        console.log('✅ Joined Daily.co call')
        setCallObject(daily)
        setIsConnected(true)
        setIsConnecting(false)
      })
      .catch((error) => {
        console.error('❌ Failed to join call:', error)
        setError('Failed to join video call. Please try again or contact support.')
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
  }, [session?.daily_room_url, session?.meeting_token, meetingToken, sessionPhase])

  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      const now = new Date()
      
      // Get session start time consistently with validation
      let sessionStartTime: Date | null = null
      
      if (session.start_time) {
        sessionStartTime = new Date(session.start_time)
      } else if ((session as any).scheduled_date && (session as any).scheduled_time) {
        // Handle scheduled_date + scheduled_time format
        const dateStr = `${(session as any).scheduled_date}T${(session as any).scheduled_time}`
        sessionStartTime = new Date(dateStr)
      } else if ((session as any).scheduled_date) {
        sessionStartTime = new Date((session as any).scheduled_date)
      }
      
      // Validate the date before using it
      if (!sessionStartTime || isNaN(sessionStartTime.getTime())) {
        console.error('❌ Invalid session start time in timer:', {
          start_time: session.start_time,
          scheduled_date: (session as any).scheduled_date,
          scheduled_time: (session as any).scheduled_time
        })
        setSessionTime(0)
        setSessionPhase('ended')
        return
      }
      
      // Define durations in milliseconds (more reliable)
      const THERAPY_DURATION_MS = 30 * 60 * 1000 // 30 minutes in ms
      const BUFFER_DURATION_MS = 30 * 60 * 1000  // 30 minutes in ms
      const TOTAL_DURATION_MS = THERAPY_DURATION_MS + BUFFER_DURATION_MS

      const therapyEndTime = new Date(sessionStartTime.getTime() + THERAPY_DURATION_MS)
      const bufferEndTime = new Date(sessionStartTime.getTime() + TOTAL_DURATION_MS)
      
      // Validate end times
      if (isNaN(therapyEndTime.getTime()) || isNaN(bufferEndTime.getTime())) {
        console.error('❌ Invalid therapy end times')
        setSessionTime(0)
        setSessionPhase('ended')
        return
      }
      
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
      // 1) Try Supabase session (may be absent if using alternate auth)
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Auth error:', error)
      }

      if (session) {
        // Check expiry
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('🔄 Token expired, refreshing...')
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            // Fall through to API auth check
          }
        }
        return true
      }

      // 2) Fallback: check our API auth (supports Clerk/custom cookies)
      try {
        const me = await fetch('/api/auth/me', { headers: { 'Cache-Control': 'no-cache' } })
        if (me.ok) {
          const meJson = await me.json()
          if (meJson?.id || meJson?.user?.id) {
            console.log('✅ API auth detected')
            return true
          }
        }
        if (me.status === 401) {
          console.log('🔒 API auth 401')
        }
      } catch (e) {
        console.error('❌ /api/auth/me check failed:', e)
      }

      // 3) If both checks fail, redirect
      router.push(`/login?next=/video-session/${sessionId}`)
      return false
    } catch (error) {
      console.error('❌ Auth validation failed:', error)
      router.push(`/login?next=/video-session/${sessionId}`)
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
            } else if (data.success && data.session) {
              // API returns { success, session }
              setSession(data.session)
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
      const response = await fetch(`/api/sessions/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Store meeting token for Daily.co authentication
          const token = data.data.meeting_token
          if (token) {
            console.log('✅ Meeting token received from API')
            setMeetingToken(token)
          } else {
            console.warn('⚠️ No meeting token in API response')
          }
          
          // Attach room details to session so Daily can join
          setSession(prev => prev ? {
            ...prev,
            daily_room_url: data.data.room_url || prev.daily_room_url || prev.session_url,
            daily_room_name: data.data.room_name || prev.daily_room_name || prev.room_name,
            meeting_token: token || prev.meeting_token
          } : prev)

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
      // First, leave the Daily.co call
      if (callObject) {
        console.log('🔴 Leaving Daily.co call...')
        try {
          await callObject.leave()
          await callObject.destroy()
          console.log('✅ Successfully left Daily.co call')
        } catch (dailyError) {
          console.error('Error leaving Daily.co call:', dailyError)
          // Continue even if Daily.co leave fails
        }
      }

      setIsConnected(false)
      toast.success('Ending session and generating SOAP notes...')

      // Wait a moment for transcription to complete (if it's in progress)
      console.log('⏳ Waiting for transcription to complete (if in progress)...')
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds

      // Call the complete endpoint to mark session as completed and generate SOAP notes
      // Try to get transcript first, if available - with retries
      let transcript: string | null = null
      console.log('🔍 Attempting to fetch transcript...')
      
      // Try fetching transcript with retries (transcription might still be processing)
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const notesResponse = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
          if (notesResponse.ok) {
            const notesData = await notesResponse.json()
            if (notesData.success && notesData.notes?.transcript) {
              transcript = notesData.notes.transcript
              console.log(`✅ Found transcript on attempt ${attempt + 1}, length: ${transcript.length} characters`)
              break
            } else {
              console.log(`⚠️ Attempt ${attempt + 1}: No transcript yet in session_notes`)
            }
          }
        } catch (notesError) {
          console.warn(`⚠️ Attempt ${attempt + 1}: Could not fetch transcript:`, notesError)
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < 4) {
          console.log(`⏳ Waiting 2 seconds before retry ${attempt + 2}...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      if (!transcript) {
        console.warn('⚠️ No transcript found after all retries - endpoint will try to fetch with its own retry logic')
      }

      // Complete session and generate SOAP notes
      try {
        const response = await fetch('/api/sessions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId,
            transcript: transcript || undefined // Pass transcript if available
          })
        })

        let result: any = null
        try {
          result = await response.json()
        } catch (jsonError) {
          // If response is not JSON, still continue
          console.warn('API response was not JSON:', jsonError)
        }
        
        if (response.ok && result?.success) {
          console.log('✅ Session complete API response:', {
            success: result.success,
            hasSoapNotes: !!result.soapNotes,
            noTranscript: result.noTranscript,
            soapNotesError: result.soapNotesError,
            message: result.message
          })
          
          if (result.soapNotes) {
            console.log('✅✅ SOAP notes were generated successfully!')
            toast.success('Session ended and SOAP notes generated successfully!')
          } else if (result.noTranscript) {
            console.warn('⚠️ No transcript found - SOAP notes cannot be generated')
            toast.warning('Session ended, but no transcript found for SOAP notes')
          } else if (result.soapNotesError) {
            console.error('❌ SOAP notes generation error:', result.soapNotesError)
            toast.warning(`Session ended, but SOAP notes failed: ${result.soapNotesError}`)
          } else {
            console.log('✅ Session completed but no SOAP notes in response')
            toast.success('Session ended successfully')
          }
          
          // Redirect to post-session review page
          router.push(`/sessions/${sessionId}/post-session`)
        } else {
          // Log error details for debugging
          console.error('❌ Session complete API failed:', {
            status: response.status,
            statusText: response.statusText,
            result: result
          })
          
          if (result) {
            console.error('Full error result:', JSON.stringify(result, null, 2))
            toast.warning(`Session ended, but SOAP notes generation had issues: ${result.error || result.message || 'Unknown error'}`)
          } else {
            toast.warning(`Session ended, but API failed with status ${response.status}`)
          }
          
          // Still redirect even if SOAP notes generation fails
          router.push(`/sessions/${sessionId}/post-session`)
        }
      } catch (apiError) {
        console.error('Error calling complete API:', apiError)
        toast.warning('Session ended, but there was an error generating SOAP notes')
        // Still redirect even if API call fails
        router.push(`/sessions/${sessionId}/post-session`)
      }
    } catch (error) {
      console.error('Error leaving session:', error)
      toast.error('Failed to leave session')
      // Still try to redirect
      setIsConnected(false)
      router.push(`/sessions/${sessionId}/post-session`)
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
                <Link href={getDashboardUrl()}>
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
            title="Toggle Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          {/* Session Notes Button - Therapist Only */}
          {session && user && user.id === session.therapist_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="text-white hover:bg-gray-700"
              title="Toggle Session Notes"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(getDashboardUrl())}
            className="text-white hover:bg-gray-700"
            title="Back to Dashboard"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className={`flex-1 relative ${showChat || showNotes ? 'mr-80' : ''}`}>
          {!isConnected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-gray-700 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Video className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  {session.status === 'in_progress' ? 'Rejoin Session' : 'Ready to Start Session'}
                </h2>
                
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
                      <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">
                  {session.status === 'in_progress' ? 
                    `You can rejoin this active session. The session will remain active until your therapist ends it.` :
                    (session as any).is_instant ? 
                      (() => {
                        const endTime = session.end_time ? new Date(session.end_time) : null;
                        const now = new Date();
                        if (endTime && endTime > now) {
                          const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / 60000);
                          return `⚡ Instant Session: You can join anytime now! This session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Once you join, the session duration is ${session.duration_minutes || 30} minutes.`;
                        }
                        return `⚡ Instant Session: You can join anytime! Once you join, the session duration is ${session.duration_minutes || 30} minutes.`;
                      })() :
                    sessionPhase === 'waiting' ? 
                      (() => {
                        try {
                          const startDate = session.start_time 
                            ? new Date(session.start_time) 
                            : (session as any).scheduled_date 
                              ? new Date(`${(session as any).scheduled_date}T${(session as any).scheduled_time || '00:00:00'}`)
                              : null
                          if (startDate && !isNaN(startDate.getTime())) {
                            return `Session starts at ${startDate.toLocaleTimeString()}. You can join 15 minutes before, but the countdown will only start at the exact scheduled time.`
                          }
                          return 'Session start time not available. Please check your session details.'
                        } catch (error) {
                          return 'Session start time not available. Please check your session details.'
                        }
                      })() :
                      `Click the button below to start your therapy session with ${session.therapist?.full_name || 'your therapist'}`
                  }
                </p>
                <Button 
                  onClick={joinSession} 
                  size="lg" 
                  className="bg-black hover:bg-gray-800"
                  disabled={isConnecting || session.status === 'completed' || session.status === 'cancelled'}
                >
                  {isConnecting ? 'Connecting...' : session.status === 'in_progress' ? 'Rejoin Session' : 'Start Session'}
                </Button>
              </div>
            </div>
          ) : sessionPhase === 'buffer' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-gray-800 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Therapy Session Ended</h2>
                <p className="text-gray-400 mb-6">
                  The 30-minute therapy session has ended. You're now in the buffer period.
                </p>
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-300">
                    <strong>Buffer Period:</strong> 30 minutes to prevent double booking of the next time slot
                  </div>
                </div>
                <Button 
                  onClick={leaveSession} 
                  size="lg" 
                  className="bg-black hover:bg-gray-800"
                >
                  Leave Session
                </Button>
              </div>
            </div>
          ) : sessionPhase === 'ended' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-gray-800 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Session Complete</h2>
                <p className="text-gray-400 mb-6">
                  The therapy session and buffer period have both ended. Thank you for your session!
                </p>
                <Button 
                  onClick={leaveSession} 
                  size="lg" 
                  className="bg-black hover:bg-gray-800"
                >
                  Return to Dashboard
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
                  
                  {/* Auto-recorder (hidden) - starts recording automatically */}
                  {callObject && (
                    <div style={{ display: 'none' }}>
                      <DailyAudioRecorder
                        callObject={callObject}
                        sessionId={sessionId}
                        autoStart={true}
                        hideUI={true}
                        onTranscriptionComplete={async (transcript) => {
                          console.log('✅ Transcription complete:', transcript.substring(0, 100) + '...')
                          toast.success('Session recorded and transcribed!')
                          
                          // Trigger SOAP notes generation
                          try {
                            const response = await fetch('/api/sessions/complete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                sessionId,
                                transcript: transcript // Pass transcript directly to avoid race condition
                              })
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
                    className={`rounded-full p-3 ${isScreenSharing ? 'bg-brand-gold' : 'bg-gray-600'}`}
                  >
                    {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="default"
                    onClick={leaveSession}
                    className="rounded-full px-4 py-2 bg-red-600 hover:bg-red-700 flex items-center gap-2 font-medium"
                  >
                    <PhoneOff className="h-5 w-5" />
                    <span>End Video</span>
                  </Button>
                </div>
              </div>
              )}
            </>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && session && user && !showNotes && (
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
        
        {/* Session Notes Sidebar - Therapist Only */}
        {showNotes && session && user && user.id === session.therapist_id && (
          <div className="w-80 bg-white border-l border-gray-200">
            <SessionNotesPanel sessionId={sessionId} />
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
