'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Star, 
  Video, 
  User, 
  MessageSquare, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface FeedbackData {
  rating: number
  technicalQuality: number
  therapistQuality: number
  comments: string
  wouldRecommend: boolean
}

interface SessionFeedbackProps {
  sessionId: string
  therapistName?: string
  onFeedbackSubmitted?: () => void
}

export default function SessionFeedback({ sessionId, therapistName, onFeedbackSubmitted }: SessionFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    technicalQuality: 0,
    therapistQuality: 0,
    comments: '',
    wouldRecommend: false
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [existingFeedback, setExistingFeedback] = useState<any>(null)

  useEffect(() => {
    fetchSessionData()
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      // Check if feedback already exists
      const feedbackResponse = await fetch(`/api/sessions/feedback?sessionId=${sessionId}`)
      const feedbackResult = await feedbackResponse.json()
      
      if (feedbackResult.success && feedbackResult.feedback?.length > 0) {
        setExistingFeedback(feedbackResult.feedback[0])
        // Pre-populate form with existing feedback
        const existing = feedbackResult.feedback[0]
        setFeedback({
          rating: existing.rating || 0,
          technicalQuality: existing.technical_quality || 0,
          therapistQuality: existing.therapist_quality || 0,
          comments: existing.comments || '',
          wouldRecommend: existing.would_recommend || false
        })
      }
      
      // Get session details
      const sessionResponse = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      const sessionResult = await sessionResponse.json()
      
      if (sessionResult.success) {
        setSessionData(sessionResult.session)
      }
      
    } catch (error) {
      console.error('Error fetching session data:', error)
      toast.error('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (type: keyof FeedbackData, value: number) => {
    setFeedback(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handleCommentsChange = (comments: string) => {
    setFeedback(prev => ({
      ...prev,
      comments
    }))
  }

  const handleRecommendationChange = (wouldRecommend: boolean) => {
    setFeedback(prev => ({
      ...prev,
      wouldRecommend
    }))
  }

  const handleSubmitFeedback = async () => {
    try {
      setSubmitting(true)
      
      if (feedback.rating === 0) {
        toast.error('Please provide an overall rating')
        return
      }
      
      const response = await fetch('/api/sessions/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          rating: feedback.rating,
          technicalQuality: feedback.technicalQuality || feedback.rating,
          therapistQuality: feedback.therapistQuality || feedback.rating,
          comments: feedback.comments,
          wouldRecommend: feedback.wouldRecommend
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Thank you for your feedback!')
        onFeedbackSubmitted?.()
      } else {
        console.error('Error submitting feedback:', result.error)
        toast.error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading feedback form...</span>
        </CardContent>
      </Card>
    )
  }

  if (existingFeedback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Feedback Already Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have already submitted feedback for this session.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Rating:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${
                      i < (existingFeedback.rating || 0) 
                        ? 'fill-current text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  ({existingFeedback.rating}/5)
                </span>
              </div>
            </div>
            
            {existingFeedback.comments && (
              <div>
                <span className="text-sm font-medium">Comments:</span>
                <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                  {existingFeedback.comments}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Submitted on {new Date(existingFeedback.created_at).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Session Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Info */}
        {sessionData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Therapist</Label>
                <p className="font-medium">{therapistName || sessionData.therapist?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Duration</Label>
                <p className="font-medium">{sessionData.duration || 30} minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Rating */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Overall Rating</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={feedback.rating >= rating ? "default" : "outline"}
                size="sm"
                onClick={() => handleRatingChange('rating', rating)}
                className="p-2 h-auto"
              >
                <Star className={`h-4 w-4 ${feedback.rating >= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
            <span className="text-sm text-gray-600 ml-2">
              ({feedback.rating}/5)
            </span>
          </div>
        </div>

        {/* Technical Quality */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Technical Quality</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={feedback.technicalQuality >= rating ? "default" : "outline"}
                size="sm"
                onClick={() => handleRatingChange('technicalQuality', rating)}
                className="p-2 h-auto"
              >
                <Video className={`h-4 w-4 ${feedback.technicalQuality >= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
            <span className="text-sm text-gray-600 ml-2">
              ({feedback.technicalQuality}/5)
            </span>
          </div>
        </div>

        {/* Therapist Quality */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Therapist Quality</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={feedback.therapistQuality >= rating ? "default" : "outline"}
                size="sm"
                onClick={() => handleRatingChange('therapistQuality', rating)}
                className="p-2 h-auto"
              >
                <User className={`h-4 w-4 ${feedback.therapistQuality >= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
            <span className="text-sm text-gray-600 ml-2">
              ({feedback.therapistQuality}/5)
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Would you recommend this therapist?</Label>
          <div className="flex gap-4">
            <Button
              variant={feedback.wouldRecommend ? "default" : "outline"}
              size="sm"
              onClick={() => handleRecommendationChange(true)}
            >
              Yes
            </Button>
            <Button
              variant={!feedback.wouldRecommend ? "default" : "outline"}
              size="sm"
              onClick={() => handleRecommendationChange(false)}
            >
              No
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <Label htmlFor="feedback-comments" className="text-sm font-medium mb-3 block">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback-comments"
            value={feedback.comments}
            onChange={(e) => handleCommentsChange(e.target.value)}
            placeholder="Share your thoughts about the session..."
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitFeedback} 
            disabled={submitting || feedback.rating === 0}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Submit Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
