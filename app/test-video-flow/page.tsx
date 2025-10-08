'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Star,
  FileText,
  CheckCircle,
  Play,
  Pause,
  Square,
  Settings,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Users,
  ArrowLeft,
  Home,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Simulated session data
const mockSession = {
  id: 'test-session-001',
  user_id: 'test-user-001',
  therapist_id: 'test-therapist-001',
  start_time: new Date().toISOString(),
  duration: 30,
  status: 'scheduled',
  session_type: 'video' as const,
  therapist: {
    id: 'test-therapist-001',
    full_name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@trpi.com'
  },
  user: {
    id: 'test-user-001',
    full_name: 'Test Patient',
    email: 'test.patient@example.com'
  }
}

// Simulated SOAP notes
const mockSOAPNotes = {
  subjective: "Patient reported feeling anxious about work deadlines and relationship stress. Mentioned difficulty sleeping and loss of appetite over the past week.",
  objective: "Patient appeared alert and oriented, but demonstrated signs of anxiety including fidgeting and rapid speech. No signs of immediate crisis.",
  assessment: "Patient presents with moderate anxiety related to work and relationship stressors. No signs of severe depression or suicidal ideation.",
  plan: "Continue weekly therapy sessions. Recommend stress management techniques including mindfulness meditation. Consider referral for psychiatric evaluation if symptoms worsen."
}

// Simulated therapist notes
const mockTherapistNotes = "Patient showed good insight into their anxiety triggers. Discussed coping strategies for work-related stress. Agreed to practice breathing exercises daily. Follow up on sleep hygiene practices next session."

// Simulated feedback data
const mockFeedback = {
  rating: 5,
  comments: "Dr. Johnson was very understanding and provided helpful coping strategies. The session was comfortable and productive.",
  wouldRecommend: true,
  technicalQuality: 5,
  therapistQuality: 5
}

interface VideoFlowState {
  currentStep: 'waiting' | 'joining' | 'in-session' | 'post-session' | 'notes' | 'feedback' | 'completed'
  sessionTime: number
  isConnected: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  isScreenSharing: boolean
  isRecording: boolean
  chatMessages: Array<{
    id: string
    sender: string
    message: string
    timestamp: string
    isTherapist?: boolean
  }>
  newMessage: string
  sessionNotes: string
  soapNotes: typeof mockSOAPNotes
  therapistNotes: string
  feedback: typeof mockFeedback
  participants: Array<{
    id: string
    name: string
    isVideoOn: boolean
    isAudioOn: boolean
    isTherapist: boolean
  }>
}

export default function TestVideoFlowPage() {
  const [state, setState] = useState<VideoFlowState>({
    currentStep: 'waiting',
    sessionTime: 0,
    isConnected: false,
    isVideoOn: true,
    isAudioOn: true,
    isScreenSharing: false,
    isRecording: false,
    chatMessages: [],
    newMessage: '',
    sessionNotes: '',
    soapNotes: mockSOAPNotes,
    therapistNotes: mockTherapistNotes,
    feedback: mockFeedback,
    participants: [
      {
        id: 'test-user-001',
        name: 'Test Patient',
        isVideoOn: true,
        isAudioOn: true,
        isTherapist: false
      },
      {
        id: 'test-therapist-001',
        name: 'Dr. Sarah Johnson',
        isVideoOn: true,
        isAudioOn: true,
        isTherapist: true
      }
    ]
  })

  const timerRef = useRef<number | null>(null)
  const sessionTimerRef = useRef<number | null>(null)

  // Simulate session timer
  useEffect(() => {
    if (state.currentStep === 'in-session') {
      sessionTimerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          sessionTime: prev.sessionTime + 1
        }))
      }, 1000)
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [state.currentStep])

  // Auto-advance steps for demo
  useEffect(() => {
    let timeout: number

    switch (state.currentStep) {
      case 'waiting':
        timeout = setTimeout(() => {
          setState(prev => ({ ...prev, currentStep: 'joining' }))
        }, 3000)
        break
      case 'joining':
        timeout = setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            currentStep: 'in-session',
            isConnected: true,
            sessionTime: 0
          }))
        }, 2000)
        break
      case 'in-session':
        // Auto-end session after 2 minutes for demo
        timeout = setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            currentStep: 'post-session',
            isConnected: false,
            isRecording: false
          }))
        }, 120000) // 2 minutes
        break
    }

    return () => clearTimeout(timeout)
  }, [state.currentStep])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeRemaining = () => {
    const totalSeconds = mockSession.duration * 60
    const remaining = totalSeconds - state.sessionTime
    return Math.max(0, remaining)
  }

  const handleJoinSession = () => {
    setState(prev => ({ ...prev, currentStep: 'joining' }))
    toast.success('Joining video session...')
  }

  const handleLeaveSession = () => {
    setState(prev => ({ 
      ...prev, 
      currentStep: 'post-session',
      isConnected: false,
      isRecording: false
    }))
    toast.success('Session ended')
  }

  const toggleVideo = () => {
    setState(prev => ({ 
      ...prev, 
      isVideoOn: !prev.isVideoOn,
      participants: prev.participants.map(p => 
        p.id === 'test-user-001' 
          ? { ...p, isVideoOn: !prev.isVideoOn }
          : p
      )
    }))
    toast.info(`Video ${!state.isVideoOn ? 'enabled' : 'disabled'}`)
  }

  const toggleAudio = () => {
    setState(prev => ({ 
      ...prev, 
      isAudioOn: !prev.isAudioOn,
      participants: prev.participants.map(p => 
        p.id === 'test-user-001' 
          ? { ...p, isAudioOn: !prev.isAudioOn }
          : p
      )
    }))
    toast.info(`Audio ${!state.isAudioOn ? 'enabled' : 'disabled'}`)
  }

  const toggleScreenShare = () => {
    setState(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }))
    toast.info(`Screen sharing ${!state.isScreenSharing ? 'started' : 'stopped'}`)
  }

  const toggleRecording = () => {
    setState(prev => ({ ...prev, isRecording: !prev.isRecording }))
    toast.info(`Recording ${!state.isRecording ? 'started' : 'stopped'}`)
  }

  const sendChatMessage = () => {
    if (state.newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: state.participants.find(p => p.id === 'test-user-001')?.name || 'You',
        message: state.newMessage.trim(),
        timestamp: new Date().toISOString(),
        isTherapist: false
      }
      
      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, message],
        newMessage: ''
      }))

      // Simulate therapist response after 2 seconds
      setTimeout(() => {
        const therapistResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'Dr. Sarah Johnson',
          message: 'That sounds challenging. Let\'s explore some coping strategies together.',
          timestamp: new Date().toISOString(),
          isTherapist: true
        }
        
        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, therapistResponse]
        }))
      }, 2000)
    }
  }

  const handleCompleteSession = () => {
    setState(prev => ({ ...prev, currentStep: 'notes' }))
    toast.success('Session completed! Please review your notes.')
  }

  const handleSubmitNotes = () => {
    setState(prev => ({ ...prev, currentStep: 'feedback' }))
    toast.success('Notes saved successfully!')
  }

  const handleSubmitFeedback = () => {
    setState(prev => ({ ...prev, currentStep: 'completed' }))
    toast.success('Thank you for your feedback!')
  }

  const resetDemo = () => {
    setState({
      currentStep: 'waiting',
      sessionTime: 0,
      isConnected: false,
      isVideoOn: true,
      isAudioOn: true,
      isScreenSharing: false,
      isRecording: false,
      chatMessages: [],
      newMessage: '',
      sessionNotes: '',
      soapNotes: mockSOAPNotes,
      therapistNotes: mockTherapistNotes,
      feedback: mockFeedback,
      participants: [
        {
          id: 'test-user-001',
          name: 'Test Patient',
          isVideoOn: true,
          isAudioOn: true,
          isTherapist: false
        },
        {
          id: 'test-therapist-001',
          name: 'Dr. Sarah Johnson',
          isVideoOn: true,
          isAudioOn: true,
          isTherapist: true
        }
      ]
    })
    toast.info('Demo reset')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Session Test Flow</h1>
              <p className="text-sm text-gray-600">Complete video therapy session simulation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {state.currentStep.replace('-', ' ')}
            </Badge>
            <Button variant="outline" size="sm" onClick={resetDemo}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Demo
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <Progress 
            value={
              state.currentStep === 'waiting' ? 10 :
              state.currentStep === 'joining' ? 20 :
              state.currentStep === 'in-session' ? 40 :
              state.currentStep === 'post-session' ? 60 :
              state.currentStep === 'notes' ? 80 :
              state.currentStep === 'feedback' ? 90 : 100
            } 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Waiting</span>
            <span>Joining</span>
            <span>Session</span>
            <span>Notes</span>
            <span>Feedback</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Session Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Session
                  {state.currentStep === 'in-session' && (
                    <Badge variant="default" className="ml-2">
                      {formatTime(getTimeRemaining())} remaining
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.currentStep === 'waiting' && (
                  <div className="text-center py-12">
                    <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Clock className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Session Starting Soon</h3>
                    <p className="text-gray-600 mb-6">
                      Your session with {mockSession.therapist.full_name} will begin shortly.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Therapist:</span>
                          <span className="font-medium">{mockSession.therapist.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{mockSession.duration} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{mockSession.session_type}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleJoinSession} size="lg" className="w-full max-w-xs">
                      <Play className="h-4 w-4 mr-2" />
                      Join Session
                    </Button>
                  </div>
                )}

                {state.currentStep === 'joining' && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                    <h3 className="text-xl font-semibold mb-4">Connecting to Video Call</h3>
                    <p className="text-gray-600">Establishing secure connection...</p>
                  </div>
                )}

                {state.currentStep === 'in-session' && (
                  <div className="space-y-4">
                    {/* Video Grid */}
                    <div className="grid grid-cols-2 gap-4 h-64 bg-gray-900 rounded-lg overflow-hidden">
                      {state.participants.map((participant) => (
                        <div key={participant.id} className="relative bg-gray-800 flex items-center justify-center">
                          {participant.isVideoOn ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                              <div className="text-white text-center">
                                <User className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm font-medium">{participant.name}</p>
                                {participant.isTherapist && (
                                  <Badge variant="secondary" className="mt-1">Therapist</Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <CameraOff className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Audio indicator */}
                          <div className="absolute top-2 left-2">
                            {participant.isAudioOn ? (
                              <Volume2 className="h-4 w-4 text-green-400" />
                            ) : (
                              <VolumeX className="h-4 w-4 text-red-400" />
                            )}
                          </div>

                          {/* Recording indicator */}
                          {state.isRecording && participant.id === 'test-user-001' && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Square className="h-2 w-2" />
                                REC
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Session Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant={state.isAudioOn ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleAudio}
                        className="rounded-full p-3"
                      >
                        {state.isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant={state.isVideoOn ? "default" : "destructive"}
                        size="sm"
                        onClick={toggleVideo}
                        className="rounded-full p-3"
                      >
                        {state.isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant={state.isScreenSharing ? "default" : "outline"}
                        size="sm"
                        onClick={toggleScreenShare}
                        className="rounded-full p-3"
                      >
                        {state.isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant={state.isRecording ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleRecording}
                        className="rounded-full p-3"
                      >
                        {state.isRecording ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLeaveSession}
                        className="rounded-full p-3"
                      >
                        <PhoneOff className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Session Timer */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Session time: {formatTime(state.sessionTime)} / {formatTime(mockSession.duration * 60)}
                      </p>
                      <Progress 
                        value={(state.sessionTime / (mockSession.duration * 60)) * 100} 
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {(state.currentStep === 'post-session' || state.currentStep === 'notes' || state.currentStep === 'feedback' || state.currentStep === 'completed') && (
                  <div className="text-center py-12">
                    <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Session Completed</h3>
                    <p className="text-gray-600 mb-6">
                      Your therapy session has ended. Thank you for participating!
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{formatTime(state.sessionTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Messages */}
            {(state.currentStep === 'in-session' || state.currentStep === 'post-session') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Session Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
                      {state.chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No messages yet</p>
                      ) : (
                        state.chatMessages.map((message) => (
                          <div key={message.id} className={`flex ${message.isTherapist ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs p-3 rounded-lg ${
                              message.isTherapist 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {state.currentStep === 'in-session' && (
                      <div className="flex gap-2">
                        <Input
                          value={state.newMessage}
                          onChange={(e) => setState(prev => ({ ...prev, newMessage: e.target.value }))}
                          placeholder="Type a message..."
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        />
                        <Button onClick={sendChatMessage} disabled={!state.newMessage.trim()}>
                          Send
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Session Info & Controls */}
          <div className="space-y-6">
            {/* Session Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Therapist</Label>
                    <p className="text-sm">{mockSession.therapist.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Patient</Label>
                    <p className="text-sm">{mockSession.user.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Duration</Label>
                    <p className="text-sm">{mockSession.duration} minutes</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <Badge variant="outline" className="capitalize">{mockSession.session_type}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge 
                      variant={
                        state.currentStep === 'waiting' ? 'secondary' :
                        state.currentStep === 'joining' ? 'default' :
                        state.currentStep === 'in-session' ? 'default' :
                        'outline'
                      }
                      className="capitalize"
                    >
                      {state.currentStep.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        participant.isTherapist ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{participant.name}</p>
                        {participant.isTherapist && (
                          <Badge variant="secondary" className="text-xs">Therapist</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {participant.isVideoOn ? (
                          <Video className="h-4 w-4 text-green-600" />
                        ) : (
                          <VideoOff className="h-4 w-4 text-gray-400" />
                        )}
                        {participant.isAudioOn ? (
                          <Mic className="h-4 w-4 text-green-600" />
                        ) : (
                          <MicOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Actions */}
            {state.currentStep === 'post-session' && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleCompleteSession} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Review Session Notes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Notes and Feedback Sections */}
        {state.currentStep === 'notes' && (
          <div className="mt-8">
            <Tabs defaultValue="soap" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
                <TabsTrigger value="therapist">Therapist Notes</TabsTrigger>
                <TabsTrigger value="patient">Your Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="soap" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      AI-Generated SOAP Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subjective</Label>
                      <Textarea 
                        value={state.soapNotes.subjective} 
                        readOnly 
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Objective</Label>
                      <Textarea 
                        value={state.soapNotes.objective} 
                        readOnly 
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Assessment</Label>
                      <Textarea 
                        value={state.soapNotes.assessment} 
                        readOnly 
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Plan</Label>
                      <Textarea 
                        value={state.soapNotes.plan} 
                        readOnly 
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="therapist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Therapist Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={state.therapistNotes} 
                      readOnly 
                      rows={8}
                      className="mt-1"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patient" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Session Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={state.sessionNotes}
                      onChange={(e) => setState(prev => ({ ...prev, sessionNotes: e.target.value }))}
                      placeholder="Add your own notes about the session..."
                      rows={8}
                      className="mt-1"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end">
                <Button onClick={handleSubmitNotes} size="lg">
                  Continue to Feedback
                </Button>
              </div>
            </Tabs>
          </div>
        )}

        {/* Feedback Section */}
        {state.currentStep === 'feedback' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Session Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Overall Rating</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={state.feedback.rating >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState(prev => ({
                          ...prev,
                          feedback: { ...prev.feedback, rating }
                        }))}
                        className="p-2"
                      >
                        <Star className={`h-4 w-4 ${state.feedback.rating >= rating ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Technical Quality</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={state.feedback.technicalQuality >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState(prev => ({
                          ...prev,
                          feedback: { ...prev.feedback, technicalQuality: rating }
                        }))}
                        className="p-2"
                      >
                        <Video className={`h-4 w-4 ${state.feedback.technicalQuality >= rating ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Therapist Quality</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={state.feedback.therapistQuality >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState(prev => ({
                          ...prev,
                          feedback: { ...prev.feedback, therapistQuality: rating }
                        }))}
                        className="p-2"
                      >
                        <User className={`h-4 w-4 ${state.feedback.therapistQuality >= rating ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Comments</Label>
                  <Textarea 
                    value={state.feedback.comments}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      feedback: { ...prev.feedback, comments: e.target.value }
                    }))}
                    placeholder="Share your thoughts about the session..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmitFeedback} size="lg">
                    Submit Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completion Section */}
        {state.currentStep === 'completed' && (
          <div className="mt-8">
            <Card>
              <CardContent className="text-center py-12">
                <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Session Complete!</h3>
                <p className="text-gray-600 mb-8">
                  Thank you for participating in this test session. Your feedback has been recorded.
                </p>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Session Duration:</span>
                        <p className="font-medium">{formatTime(state.sessionTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center gap-1">
                          {[...Array(state.feedback.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={resetDemo}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Again
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard">
                        <Home className="h-4 w-4 mr-2" />
                        Back to Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
