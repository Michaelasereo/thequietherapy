"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Video, Users, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import SessionNotesPanel from "@/components/session-notes-panel"

function VideoCallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roomName, setRoomName] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [roomUrl, setRoomUrl] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isTherapist, setIsTherapist] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showSessionNotes, setShowSessionNotes] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingId, setRecordingId] = useState('')
  const [aiProcessingStatus, setAiProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')

  // Check if we have room parameters from URL
  useEffect(() => {
    const urlRoom = searchParams.get('room')
    const urlParticipant = searchParams.get('participant')
    const urlSessionId = searchParams.get('sessionId')
    const urlIsTherapist = searchParams.get('isTherapist')
    
    if (urlRoom) setRoomName(urlRoom)
    if (urlParticipant) setParticipantName(urlParticipant)
    if (urlSessionId) setSessionId(urlSessionId)
    if (urlIsTherapist) setIsTherapist(urlIsTherapist === 'true')
  }, [searchParams])

  // Timer for call duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isInCall])

  const createRoom = async () => {
    if (!roomName || !participantName) {
      setError('Please enter both room name and participant name')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Create room with session-specific name if sessionId exists
      const finalRoomName = sessionId ? `trpi-session-${sessionId}` : `trpi-${roomName}`
      
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: finalRoomName,
          properties: {
            exp: Math.round(Date.now() / 1000) + (60 * 60 * 2), // 2 hours
            eject_at_room_exp: true,
            enable_chat: true,
            enable_recording: true, // Enable recording for AI processing
            start_video_off: false,
            start_audio_off: false
          }
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRoomUrl(data.room.url)
        setIsInCall(true)
        
        // Start recording if this is a therapy session
        if (sessionId && isTherapist) {
          await startSessionRecording(finalRoomName)
        }
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch (err) {
      console.error('Create room error:', err)
      setError('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const startSessionRecording = async (roomName: string) => {
    try {
      const response = await fetch('/api/daily/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomName,
          sessionId,
          layout: 'single',
          audioOnly: false
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setIsRecording(true)
        setRecordingId(data.recording.id)
        console.log('Recording started:', data.recording.id)
      } else {
        console.error('Failed to start recording:', data.error)
      }
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const joinRoom = async () => {
    if (!roomName || !participantName) {
      setError('Please enter both room name and participant name')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Try to get existing room first
      const roomUrl = `https://thequietherapy.daily.co/trpi-${roomName}`
      setRoomUrl(roomUrl)
      setIsInCall(true)
    } catch (err) {
      console.error('Join room error:', err)
      setError('Failed to join room')
    } finally {
      setIsCreating(false)
    }
  }

  const leaveCall = async () => {
    setIsInCall(false)
    setRoomUrl('')
    
    // Stop recording if active
    if (isRecording && recordingId) {
      await stopSessionRecording()
    }
    
    // If this is a session, end it properly
    if (sessionId) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            duration: callDuration,
            endTime: new Date().toISOString()
          })
        })

        if (response.ok) {
          console.log('Session ended successfully')
          
          // Start AI processing if we have a recording
          if (recordingId && isTherapist) {
            setAiProcessingStatus('processing')
            await startAIProcessing()
          }
        }
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }
    
    router.push('/dashboard')
  }

  const stopSessionRecording = async () => {
    try {
      const response = await fetch('/api/daily/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordingId
        })
      })

      if (response.ok) {
        setIsRecording(false)
        console.log('Recording stopped successfully')
      } else {
        console.error('Failed to stop recording')
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  const startAIProcessing = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/ai-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          recordingId
        })
      })

      if (response.ok) {
        setAiProcessingStatus('processing')
        console.log('AI processing started')
      } else {
        setAiProcessingStatus('error')
        console.error('Failed to start AI processing')
      }
    } catch (error) {
      setAiProcessingStatus('error')
      console.error('Error starting AI processing:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isInCall && roomUrl) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={leaveCall} className="text-white hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Call
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Live • {formatTime(callDuration)}</span>
            </div>
            {sessionId && (
              <div className="text-sm text-gray-300">
                Session #{sessionId}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isTherapist && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionNotes(!showSessionNotes)}
                className="text-white hover:bg-gray-700"
              >
                Session Notes
              </Button>
            )}
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Main Video Area */}
          <div className={`flex-1 relative ${showSessionNotes ? 'mr-80' : ''}`}>
            <iframe
              src={`${roomUrl}?t=${Date.now()}`}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; speaker; display-capture"
            />
          </div>

          {/* Session Notes Sidebar (Therapist Only) */}
          {showSessionNotes && isTherapist && (
            <SessionNotesPanel sessionId={sessionId} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Video Session</CardTitle>
            <p className="text-muted-foreground">Join or create a video therapy session</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="participantName">Your Name</Label>
              <Input
                id="participantName"
                placeholder="Enter your name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={createRoom} 
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
              <Button 
                onClick={joinRoom} 
                disabled={isCreating}
                variant="outline"
                className="flex-1"
              >
                {isCreating ? "Joining..." : "Join Room"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>• Rooms expire after 2 hours</p>
              <p>• Share the room name with your therapist</p>
              <p>• Ensure your camera and microphone are enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading video call...</p>
        </div>
      </div>
    }>
      <VideoCallContent />
    </Suspense>
  )
}
