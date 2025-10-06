'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Send, 
  Loader2,
  User
} from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_type: 'patient' | 'therapist'
  message: string
  created_at: string
}

interface SessionChatProps {
  sessionId: string
  currentUserId: string
  currentUserName: string
  userType: 'patient' | 'therapist'
  isActive: boolean
}

export default function SessionChat({ 
  sessionId, 
  currentUserId, 
  currentUserName, 
  userType, 
  isActive 
}: SessionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && sessionId) {
      fetchMessages()
      // Poll for new messages every 2 seconds
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [sessionId, isActive])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/sessions/chat?sessionId=${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        setMessages(result.messages || [])
      } else {
        console.error('Error fetching chat messages:', result.error)
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      
      const response = await fetch('/api/sessions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: newMessage.trim(),
          senderId: currentUserId,
          senderName: currentUserName,
          senderType: userType
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setNewMessage('')
        // Add the new message to the local state immediately
        setMessages(prev => [...prev, result.message])
      } else {
        console.error('Error sending message:', result.error)
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Session Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Chat will be available during the session</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Session Chat
          {messages.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md`}>
                  <div className={`flex items-start gap-2 ${message.sender_id === currentUserId ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      message.sender_type === 'therapist' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    
                    {/* Message bubble */}
                    <div className={`flex flex-col ${message.sender_id === currentUserId ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-lg ${
                        message.sender_id === currentUserId
                          ? 'bg-blue-600 text-white'
                          : message.sender_type === 'therapist'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      
                      {/* Message metadata */}
                      <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                        message.sender_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <span className="font-medium">
                          {message.sender_id === currentUserId ? 'You' : message.sender_name}
                        </span>
                        <span>•</span>
                        <span>{formatTime(message.created_at)}</span>
                        {message.sender_type === 'therapist' && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              Therapist
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="sm"
            className="px-3"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
