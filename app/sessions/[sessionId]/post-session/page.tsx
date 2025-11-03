'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  ArrowLeft, 
  Home, 
  FileText, 
  MessageSquare,
  Star,
  Clock,
  User,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import SessionNotes from "@/components/session-notes"
import SessionFeedback from "@/components/session-feedback"
import { useAuth } from '@/context/auth-context'

interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  status: string
  duration: number
  session_type: string
  therapist?: {
    full_name: string
    email: string
  }
  user?: {
    full_name: string
    email: string
  }
}

type PostSessionStep = 'notes' | 'feedback' | 'completed'

export default function PostSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userType: authUserType } = useAuth()
  const sessionId = params.sessionId as string
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentStep, setCurrentStep] = useState<PostSessionStep>('notes')
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'patient' | 'therapist'>('patient')
  
  // Helper function to get dashboard URL based on auth user type
  const getDashboardUrl = () => {
    switch (authUserType) {
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

  useEffect(() => {
    if (sessionId && user?.id) {
      fetchSessionData()
    }
  }, [sessionId, user?.id])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        setSessionData(result.session)
        
        // Determine user type
        if (user?.id === result.session.therapist_id) {
          setUserType('therapist')
        } else if (user?.id === result.session.user_id) {
          setUserType('patient')
        } else {
          toast.error('You are not authorized to view this session')
          router.push(getDashboardUrl())
          return
        }
        
        // Check if session is completed - wait a bit if it's still in progress
        // The session might have just been completed but the status hasn't updated yet
        if (result.session.status !== 'completed') {
          console.log('⚠️ Session status is not completed:', result.session.status)
          
          // If session is in_progress, wait a moment and retry once
          if (result.session.status === 'in_progress') {
            console.log('⏳ Session still in progress, waiting 2 seconds and retrying...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Retry fetching session data
            const retryResponse = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
            const retryResult = await retryResponse.json()
            
            if (retryResult.success && retryResult.session.status === 'completed') {
              setSessionData(retryResult.session)
              // Continue with the flow
            } else {
              toast.warning('Session is still in progress. Please wait a moment.')
              // Don't redirect immediately - let user see the message
              setTimeout(() => router.push(getDashboardUrl()), 3000)
              return
            }
          } else {
            toast.error('This session is not yet completed')
            router.push(getDashboardUrl())
            return
          }
        }
        
      } else {
        console.error('Error fetching session data:', result.error)
        toast.error('Failed to load session data')
        router.push(getDashboardUrl())
      }
    } catch (error) {
      console.error('Error fetching session data:', error)
      toast.error('Failed to load session data')
      router.push(getDashboardUrl())
    } finally {
      setLoading(false)
    }
  }

  const handleNotesSaved = () => {
    // Move to feedback step for patients, or complete for therapists
    if (userType === 'patient') {
      setCurrentStep('feedback')
    } else {
      setCurrentStep('completed')
    }
  }

  const handleFeedbackSubmitted = () => {
    setCurrentStep('completed')
  }

  const getProgressValue = () => {
    switch (currentStep) {
      case 'notes': return 50
      case 'feedback': return 75
      case 'completed': return 100
      default: return 25
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'notes': return 'Session Notes'
      case 'feedback': return 'Session Feedback'
      case 'completed': return 'Session Complete'
      default: return 'Post-Session'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading session data...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session not found or access denied.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href={getDashboardUrl()}>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
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
              <Link href={getDashboardUrl()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post-Session Review</h1>
              <p className="text-sm text-gray-600">
                Session with {sessionData.therapist?.full_name || 'Therapist'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {userType}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {sessionData.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
            <span className="text-sm text-gray-500">
              {currentStep === 'notes' ? 'Step 1 of 2' : 
               currentStep === 'feedback' ? 'Step 2 of 2' : 
               'Complete'}
            </span>
          </div>
          <Progress value={getProgressValue()} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className={currentStep === 'notes' ? 'font-medium text-blue-600' : ''}>
              Notes
            </span>
            {userType === 'patient' && (
              <span className={currentStep === 'feedback' ? 'font-medium text-blue-600' : ''}>
                Feedback
              </span>
            )}
            <span className={currentStep === 'completed' ? 'font-medium text-blue-600' : ''}>
              Complete
            </span>
          </div>
        </div>

        {/* Session Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {userType === 'patient' ? 'Therapist' : 'Patient'}
                  </p>
                  <p className="font-medium">
                    {userType === 'patient' 
                      ? sessionData.therapist?.full_name || 'Unknown'
                      : sessionData.user?.full_name || 'Unknown'
                    }
                  </p>
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
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {currentStep === 'notes' && (
          <SessionNotes
            sessionId={sessionId}
            userType={userType}
            onNotesSaved={handleNotesSaved}
          />
        )}

        {currentStep === 'feedback' && (
          <SessionFeedback
            sessionId={sessionId}
            therapistName={sessionData.therapist?.full_name}
            onFeedbackSubmitted={handleFeedbackSubmitted}
          />
        )}

        {currentStep === 'completed' && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Session Review Complete!</h3>
              <p className="text-gray-600 mb-8">
                Thank you for completing the post-session review. Your feedback helps us improve our services.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push(getDashboardUrl())}>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push(`${getDashboardUrl()}/sessions`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
