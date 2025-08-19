'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  Clock, 
  User, 
  Settings,
  Maximize,
  Minimize,
  Share,
  MoreVertical,
  Send,
  Save,
  X
} from "lucide-react"
import { toast } from "sonner"

interface VideoCallInterfaceProps {
  sessionId: string
  roomUrl: string
  participantName: string
  isTherapist: boolean
  onSessionEnd: () => void
  onSessionComplete: () => void
}

interface SessionNote {
  id?: string
  session_id: string
  therapist_id: string
  user_id: string
  notes: string
  mood_rating?: number
  progress_notes?: string
  homework_assigned?: string
  next_session_focus?: string
  created_at?: string
}

export default function VideoCallInterface({
  sessionId,
  roomUrl,
  participantName,
  isTherapist,
  onSessionEnd,
  onSessionComplete
}: VideoCallInterfaceProps) {
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: string}>>([])
  const [sessionNotes, setSessionNotes] = useState<SessionNote | null>(null)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isInCall])

  // Load existing session notes
  useEffect(() => {
    if (isTherapist && sessionId) {
      loadSessionNotes()
    }
  }, [sessionId, isTherapist])

  const loadSessionNotes = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/notes`)
      if (response.ok) {
        const data = await response.json()
        if (data.notes) {
          setSessionNotes(data.notes)
        }
      }
    } catch (error) {
      console.error('Error loading session notes:', error)
    }
  }

  const handleStartCall = () => {
    setIsInCall(true)
    toast.success("Session started!")
  }

  const handleEndCall = () => {
    setShowEndSessionDialog(true)
  }

  const confirmEndSession = async () => {
    setIsInCall(false)
    setShowEndSessionDialog(false)
    
    try {
      // Update session status
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
        toast.success("Session ended successfully")
        onSessionEnd()
      } else {
        toast.error("Failed to end session")
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error("Error ending session")
    }
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    // Send message to iframe to toggle video
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'toggle-video',
        enabled: !isVideoOn
      }, '*')
    }
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
    // Send message to iframe to toggle audio
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'toggle-audio',
        enabled: !isAudioOn
      }, '*')
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (iframeRef.current) {
      if (isFullscreen) {
        document.exitFullscreen()
      } else {
        iframeRef.current.requestFullscreen()
      }
    }
  }

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        sender: participantName,
        message: chatMessage,
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, newMessage])
      setChatMessage('')
    }
  }

  const saveSessionNotes = async () => {
    if (!isTherapist) return

    setIsSavingNotes(true)
    try {
      const notesData = {
        session_id: sessionId,
        notes: sessionNotes?.notes || '',
        mood_rating: sessionNotes?.mood_rating || 5,
        progress_notes: sessionNotes?.progress_notes || '',
        homework_assigned: sessionNotes?.homework_assigned || '',
        next_session_focus: sessionNotes?.next_session_focus || ''
      }

      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notesData)
      })

      if (response.ok) {
        toast.success("Session notes saved successfully")
        const data = await response.json()
        setSessionNotes(data.notes)
      } else {
        toast.error("Failed to save session notes")
      }
    } catch (error) {
      console.error('Error saving session notes:', error)
      toast.error("Error saving session notes")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isInCall ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm">
              {isInCall ? 'Live' : 'Ready'} • {formatTime(callDuration)}
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
          {isTherapist && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="text-white hover:bg-gray-700"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className={`flex-1 relative ${showChat || showNotes ? 'mr-80' : ''}`}>
          {!isInCall ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="bg-gray-700 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Video className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Ready to Start Session</h2>
                <p className="text-gray-400 mb-6">
                  Click the button below to start your therapy session
                </p>
                <Button onClick={handleStartCall} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Phone className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Call iframe */}
              <iframe
                ref={iframeRef}
                src={`${roomUrl}?t=${Date.now()}`}
                className="w-full h-full border-0"
                allow="camera; microphone; fullscreen; speaker; display-capture"
              />
              
              {/* Call Controls */}
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
                    variant="destructive"
                    size="sm"
                    onClick={handleEndCall}
                    className="rounded-full p-3 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar - Chat */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Session Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === participantName ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    msg.sender === participantName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar - Session Notes (Therapist Only) */}
        {showNotes && isTherapist && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Session Notes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveSessionNotes}
                disabled={isSavingNotes}
                className="text-white hover:bg-gray-700"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <Label className="text-sm text-gray-300">Session Notes</Label>
                <Textarea
                  ref={notesRef}
                  value={sessionNotes?.notes || ''}
                  onChange={(e) => setSessionNotes(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter session notes..."
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  rows={6}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Progress Notes</Label>
                <Textarea
                  value={sessionNotes?.progress_notes || ''}
                  onChange={(e) => setSessionNotes(prev => ({ ...prev, progress_notes: e.target.value }))}
                  placeholder="Patient progress and observations..."
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  rows={4}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Homework Assigned</Label>
                <Textarea
                  value={sessionNotes?.homework_assigned || ''}
                  onChange={(e) => setSessionNotes(prev => ({ ...prev, homework_assigned: e.target.value }))}
                  placeholder="Assignments for next session..."
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Next Session Focus</Label>
                <Textarea
                  value={sessionNotes?.next_session_focus || ''}
                  onChange={(e) => setSessionNotes(prev => ({ ...prev, next_session_focus: e.target.value }))}
                  placeholder="Topics to focus on next session..."
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End Session Dialog */}
      <Dialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>End Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to end this session?</p>
            <p className="text-sm text-gray-400">
              Duration: {formatTime(callDuration)}
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEndSessionDialog(false)}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
