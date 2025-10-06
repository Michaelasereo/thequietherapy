'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Star, 
  User, 
  Clock, 
  MessageSquare,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth } from '@/context/auth-context'

interface FeedbackData {
  id: string
  rating: number
  technical_quality: number
  therapist_quality: number
  comments: string
  would_recommend: boolean
  created_at: string
  sessions: {
    id: string
    scheduled_date: string
    scheduled_time: string
    users: {
      full_name: string
      email: string
    }
  }
}

export default function TherapistFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.sessionId as string
  
  const [feedback, setFeedback] = useState<FeedbackData[]>([])
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId && user?.id) {
      fetchFeedbackData()
    }
  }, [sessionId, user?.id])

  const fetchFeedbackData = async () => {
    try {
      setLoading(true)
      
      // Fetch feedback for this session
      const feedbackResponse = await fetch(`/api/sessions/feedback?sessionId=${sessionId}`)
      const feedbackResult = await feedbackResponse.json()
      
      if (feedbackResult.success) {
        setFeedback(feedbackResult.feedback || [])
      }
      
      // Fetch session details
      const sessionResponse = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      const sessionResult = await sessionResponse.json()
      
      if (sessionResult.success) {
        setSessionData(sessionResult.session)
      }
      
    } catch (error) {
      console.error('Error fetching feedback data:', error)
      toast.error('Failed to load feedback data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading feedback...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/therapist/dashboard/client-sessions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sessions
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Feedback</h1>
              <p className="text-sm text-gray-600">
                {sessionData ? `Session with ${sessionData.users?.full_name || 'Patient'}` : 'Loading session details...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Session Info */}
        {sessionData && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-medium">{sessionData.users?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{sessionData.duration || 30} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge variant="outline" className="capitalize">
                      {sessionData.session_type || 'individual'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="outline" className="capitalize">
                      {sessionData.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Content */}
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
                <p className="text-gray-600 mb-6">
                  The patient hasn't submitted feedback for this session yet.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/therapist/dashboard/client-sessions">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sessions
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/sessions/${sessionId}/post-session`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Review Session
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {feedback.map((feedbackItem) => (
              <Card key={feedbackItem.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Patient Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Rating */}
                  <div>
                    <h4 className="font-medium mb-3">Overall Rating</h4>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${
                            i < feedbackItem.rating 
                              ? 'fill-current text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="text-lg font-medium ml-2">
                        {feedbackItem.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Quality Ratings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Technical Quality</h4>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < feedbackItem.technical_quality 
                                ? 'fill-current text-blue-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="text-sm ml-2">
                          {feedbackItem.technical_quality}/5
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Therapist Quality</h4>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < feedbackItem.therapist_quality 
                                ? 'fill-current text-green-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="text-sm ml-2">
                          {feedbackItem.therapist_quality}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <h4 className="font-medium mb-2">Would Recommend</h4>
                    <Badge 
                      variant={feedbackItem.would_recommend ? "default" : "destructive"}
                      className="capitalize"
                    >
                      {feedbackItem.would_recommend ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  {/* Comments */}
                  {feedbackItem.comments && (
                    <div>
                      <h4 className="font-medium mb-3">Comments</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {feedbackItem.comments}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Feedback Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Submitted on {formatDate(feedbackItem.created_at)} at {formatTime(feedbackItem.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/therapist/dashboard/client-sessions">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sessions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/sessions/${sessionId}/post-session`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Review Session
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
