"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Video, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles,
  Play,
  Square,
  FileText
} from "lucide-react"

export default function TestVideoSessionFlow() {
  const [sessionId, setSessionId] = useState('550e8400-e29b-41d4-a716-446655440000')
  const [roomName, setRoomName] = useState('test-room')
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingId, setRecordingId] = useState('')
  const [aiProcessingStatus, setAiProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')
  const [sessionNotes, setSessionNotes] = useState<any>(null)
  const [webhookEvents, setWebhookEvents] = useState<any[]>([])

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

  const startCall = async () => {
    setIsInCall(true)
    setCallDuration(0)
    console.log('Starting test video call...')
    console.log('Test session will be created automatically when needed')
  }

  const startRecording = async () => {
    setIsRecording(true)
    const newRecordingId = `test-recording-${Date.now()}`
    setRecordingId(newRecordingId)
    
    // Simulate webhook event for recording started
           const webhookEvent = {
         event: 'recording.started',
         data: {
           id: newRecordingId,
           room_name: `trpi-session-${sessionId.replace(/-/g, '')}`,
           started_at: new Date().toISOString()
         },
         timestamp: new Date().toISOString()
       }
    
    setWebhookEvents(prev => [...prev, webhookEvent])
    
    // Send webhook to local endpoint
    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookEvent)
      })
    } catch (error) {
      console.error('Error sending webhook:', error)
    }
    
    console.log('Recording started:', newRecordingId)
  }

  const stopRecording = async () => {
    setIsRecording(false)
    
    // Simulate webhook event for recording finished
         const webhookEvent = {
       event: 'recording.finished',
       data: {
         id: recordingId,
         room_name: `trpi-session-${sessionId.replace(/-/g, '')}`,
         download_url: 'https://example.com/test-recording.mp4',
         duration: callDuration,
         finished_at: new Date().toISOString()
       },
       timestamp: new Date().toISOString()
     }
    
    setWebhookEvents(prev => [...prev, webhookEvent])
    
    // Send webhook to local endpoint
    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookEvent)
      })
    } catch (error) {
      console.error('Error sending webhook:', error)
    }
    
    console.log('Recording stopped:', recordingId)
  }

  const endCall = async () => {
    setIsInCall(false)
    
    // Skip session end API for now due to webpack errors
    console.log('Call ended, starting AI processing...')
    
    // Start AI processing directly
    if (recordingId) {
      setAiProcessingStatus('processing')
      await startAIProcessing()
    }
  }

  const startAIProcessing = async () => {
    try {
      setAiProcessingStatus('processing')
      console.log('AI processing started')
      
      const response = await fetch(`/api/sessions/${sessionId}/ai-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          recordingId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiProcessingStatus('completed')
        console.log('AI processing completed:', data)
        
        // Set the session notes directly from the AI processing response
        if (data.notes) {
          setSessionNotes(data.notes)
        }
      } else {
        setAiProcessingStatus('error')
        console.error('Failed to start AI processing')
      }
    } catch (error) {
      setAiProcessingStatus('error')
      console.error('Error starting AI processing:', error)
    }
  }

  const loadSessionNotes = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setSessionNotes(data.notes)
      }
    } catch (error) {
      console.error('Error loading session notes:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Session Flow Test</h1>
          <p className="text-gray-600">Test the complete video session flow including webhooks and AI processing</p>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Session ID</Label>
                <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
              </div>
              <div>
                <Label>Room Name</Label>
                <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={isInCall ? "default" : "secondary"}>
                {isInCall ? "In Call" : "Not in Call"}
              </Badge>
              {isInCall && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(callDuration)}</span>
                </div>
              )}
              <Badge variant={isRecording ? "destructive" : "secondary"}>
                {isRecording ? "Recording" : "Not Recording"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Call Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Call Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {!isInCall ? (
                <Button onClick={startCall} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Call
                </Button>
              ) : (
                <>
                  {!isRecording ? (
                    <Button onClick={startRecording} className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  )}
                  <Button onClick={endCall} variant="outline" className="flex items-center gap-2">
                    End Call
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={
                aiProcessingStatus === 'completed' ? 'default' :
                aiProcessingStatus === 'processing' ? 'secondary' :
                aiProcessingStatus === 'error' ? 'destructive' : 'outline'
              }>
                {aiProcessingStatus === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {aiProcessingStatus === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {aiProcessingStatus === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                {aiProcessingStatus.charAt(0).toUpperCase() + aiProcessingStatus.slice(1)}
              </Badge>
              {recordingId && (
                <span className="text-sm text-gray-600">Recording ID: {recordingId}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Notes */}
        {sessionNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionNotes.transcript && (
                  <div>
                    <Label>Transcript</Label>
                    <Textarea 
                      value={sessionNotes.transcript} 
                      readOnly 
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
                {sessionNotes.soap_subjective && (
                  <div>
                    <Label>SOAP - Subjective</Label>
                    <Textarea 
                      value={sessionNotes.soap_subjective} 
                      readOnly 
                      rows={3}
                    />
                  </div>
                )}
                {sessionNotes.soap_objective && (
                  <div>
                    <Label>SOAP - Objective</Label>
                    <Textarea 
                      value={sessionNotes.soap_objective} 
                      readOnly 
                      rows={3}
                    />
                  </div>
                )}
                {sessionNotes.soap_assessment && (
                  <div>
                    <Label>SOAP - Assessment</Label>
                    <Textarea 
                      value={sessionNotes.soap_assessment} 
                      readOnly 
                      rows={3}
                    />
                  </div>
                )}
                {sessionNotes.soap_plan && (
                  <div>
                    <Label>SOAP - Plan</Label>
                    <Textarea 
                      value={sessionNotes.soap_plan} 
                      readOnly 
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhook Events */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {webhookEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No webhook events yet</p>
              ) : (
                webhookEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.event}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
