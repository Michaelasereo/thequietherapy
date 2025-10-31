'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  CheckCircle,
  XCircle,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PendingSession {
  id: string
  therapist_id: string
  therapist?: {
    id: string
    full_name: string
    email: string
  }
  scheduled_date?: string
  scheduled_time?: string
  start_time: string
  end_time: string
  duration_minutes: number
  session_type: string
  status: string
  title?: string
  description?: string
  notes?: string
  is_instant: boolean
  created_at: string
}

interface PendingSessionApprovalProps {
  onApprovalComplete?: (sessionId: string) => void
}

export default function PendingSessionApproval({ onApprovalComplete }: PendingSessionApprovalProps) {
  const router = useRouter()
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingSessionId, setApprovingSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingSessions()
  }, [])

  const fetchPendingSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions/pending', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setPendingSessions(result.data.sessions || [])
        }
      }
    } catch (error) {
      console.error('Error fetching pending sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (sessionId: string, isInstant: boolean) => {
    try {
      setApprovingSessionId(sessionId)
      
      const response = await fetch('/api/sessions/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(
          isInstant 
            ? 'Session approved! Redirecting to video session...' 
            : 'Session approved successfully!'
        )
        
        // Remove approved session from list
        setPendingSessions(prev => prev.filter(s => s.id !== sessionId))
        
        // For instant sessions, redirect to video session immediately
        if (isInstant) {
          setTimeout(() => {
            router.push(`/video-session/${sessionId}`)
          }, 1000)
        }
        
        // Callback if provided
        if (onApprovalComplete) {
          onApprovalComplete(sessionId)
        }
      } else {
        const errorMsg = result.error || 'Failed to approve session'
        toast.error(errorMsg)
        
        if (errorMsg.includes('Insufficient credits')) {
          // Redirect to purchase credits
          setTimeout(() => {
            router.push('/dashboard/purchase-credits')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error approving session:', error)
      toast.error('Failed to approve session. Please try again.')
    } finally {
      setApprovingSessionId(null)
    }
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (dateString && timeString) {
      const date = new Date(`${dateString}T${timeString}`)
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading pending sessions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pending Session Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No pending sessions to approve</p>
            <p className="text-sm text-gray-500 mt-1">Your therapist will notify you when a session needs approval</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Pending Session Approvals ({pendingSessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>Action Required:</strong> Your therapist has created {pendingSessions.length} session{pendingSessions.length > 1 ? 's' : ''} that need your approval. 
            Approving will deduct 1 credit from your account.
          </AlertDescription>
        </Alert>

        {pendingSessions.map((session) => (
          <Card key={session.id} className="border-2 border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {session.is_instant ? (
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Zap className="h-5 w-5 text-yellow-600" />
                      </div>
                    ) : (
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {session.is_instant ? '⚡ Instant Session' : '📅 Custom Session'}
                      </h3>
                      {session.therapist && (
                        <p className="text-sm text-gray-600">
                          With {session.therapist.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={session.is_instant ? 'default' : 'secondary'} className="bg-yellow-200 text-yellow-800">
                    {session.is_instant ? 'Instant' : 'Pending Approval'}
                  </Badge>
                </div>

                {/* Session Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {session.is_instant ? (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Ready to Start Immediately</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {session.scheduled_date && session.scheduled_time
                            ? formatDateTime(session.scheduled_date, session.scheduled_time)
                            : formatDateTime(session.start_time)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{session.duration_minutes || 30} minutes</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span className="text-sm capitalize">{session.session_type || 'video'}</span>
                    </div>
                  </div>

                  {session.notes && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Therapist Notes:</p>
                      <p className="text-sm text-gray-700">{session.notes}</p>
                    </div>
                  )}
                </div>

                {/* Credit Information */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Credit Required:</strong> Approving this session will deduct <strong>1 credit</strong> from your account.
                    {session.is_instant && (
                      <span className="block mt-1">⚡ After approval, you can join the session immediately!</span>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(session.id, session.is_instant)}
                    disabled={approvingSessionId === session.id}
                    className="flex-1 bg-black hover:bg-gray-800 text-white"
                    size="lg"
                  >
                    {approvingSessionId === session.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {session.is_instant ? 'Approve & Join Now' : 'Approve Session'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

