"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Video, Users, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

function VideoCallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roomName, setRoomName] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [roomUrl, setRoomUrl] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [error, setError] = useState('')

  // Check if we have room parameters from URL
  useEffect(() => {
    const urlRoom = searchParams.get('room')
    const urlParticipant = searchParams.get('participant')
    
    if (urlRoom) setRoomName(urlRoom)
    if (urlParticipant) setParticipantName(urlParticipant)
  }, [searchParams])

  const createRoom = async () => {
    if (!roomName || !participantName) {
      setError('Please enter both room name and participant name')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: `trpi-${roomName}`,
          properties: {
            exp: Math.round(Date.now() / 1000) + (60 * 60 * 2), // 2 hours
            eject_at_room_exp: true,
            enable_chat: true,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false
          }
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRoomUrl(data.room.url)
        setIsInCall(true)
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

  const leaveCall = () => {
    setIsInCall(false)
    setRoomUrl('')
    router.push('/dashboard')
  }

  if (isInCall && roomUrl) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <Button variant="ghost" onClick={leaveCall} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Call
            </Button>
          </div>
          
          <div className="w-full h-[600px] bg-black rounded-lg overflow-hidden">
            <iframe
              src={`${roomUrl}?t=${Date.now()}`}
              style={{
                width: '100%',
                height: '100%',
                border: '0',
                borderRadius: '8px'
              }}
              allow="camera; microphone; fullscreen; speaker; display-capture"
            />
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Room: {roomName} | Participant: {participantName}</p>
            <p>Share this link with others: {roomUrl}</p>
          </div>
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
