'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Home, 
  FileText, 
  Clock,
  User,
  Loader2,
  AlertCircle,
  Calendar,
  X
} from "lucide-react"
import { toast } from "sonner"
import SessionNotes from "@/components/session-notes"
import SessionFeedback from "@/components/session-feedback"
import ScheduleNextSessionModal from "@/components/schedule-next-session-modal"
import { useAuth } from '@/context/auth-context'

interface SessionData {
  id: string
  user_id: string
  therapist_id: string
  status: string
  duration?: number
  duration_minutes?: number
  session_type?: string
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

interface PostSessionModalProps {
  sessionId: string | null
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function PostSessionModal({ sessionId, isOpen, onClose, onComplete }: PostSessionModalProps) {
  const { user } = useAuth()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentStep, setCurrentStep] = useState<PostSessionStep>('notes')
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'patient' | 'therapist'>('patient')
  const [showScheduleNext, setShowScheduleNext] = useState(false)

  useEffect(() => {
    if (sessionId && user?.id && isOpen) {
      fetchSessionData()
    } else {
      // Reset state when modal closes
      if (!isOpen) {
        setCurrentStep('notes')
        setSessionData(null)
        setLoading(true)
      }
    }
  }, [sessionId, user?.id, isOpen])

  const fetchSessionData = async () => {
    if (!sessionId) {
      console.error('❌ Cannot fetch session data: sessionId is null')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        console.log('📋 Modal received session data:', {
          sessionId: result.session.id,
          therapist: result.session.therapist,
          user: result.session.user
        });
        
        setSessionData(result.session)
        
        // Determine user type
        if (user?.id === result.session.therapist_id) {
          setUserType('therapist')
        } else if (user?.id === result.session.user_id) {
          setUserType('patient')
        } else {
          toast.error('You are not authorized to view this session')
          onClose()
          return
        }
        
        // Check if session is completed
        if (result.session.status !== 'completed') {
          toast.error('This session is not yet completed')
          onClose()
          return
        }
        
      } else {
        console.error('Error fetching session data:', result.error)
        toast.error('Failed to load session data')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching session data:', error)
      toast.error('Failed to load session data')
      onClose()
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

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
    onClose()
  }

  const handleScheduleNextClick = () => {
    setShowScheduleNext(true)
  }

  const handleScheduleNextClose = () => {
    setShowScheduleNext(false)
  }

  const handleNextSessionScheduled = () => {
    setShowScheduleNext(false)
    toast.success('Next session scheduled! Closing review...')
    setTimeout(() => {
      handleComplete()
    }, 1500)
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

  return (
    <>
      {/* Schedule Next Session Modal */}
      {sessionData && userType === 'therapist' && (
        <ScheduleNextSessionModal
          isOpen={showScheduleNext}
          onClose={handleScheduleNextClose}
          patientId={sessionData.user_id}
          patientName={sessionData.user?.full_name || 'Patient'}
          therapistId={sessionData.therapist_id}
          currentSessionId={sessionData.id}
          onSessionScheduled={handleNextSessionScheduled}
        />
      )}
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Post-Session Review</h2>
              {sessionData && (
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Session with {sessionData.therapist?.full_name || 'Therapist'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sessionData && (
                <>
                  <Badge variant="outline" className="capitalize">
                    {userType}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {sessionData.status}
                  </Badge>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading session data...</span>
          </div>
        ) : !sessionData ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Session not found or access denied.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{getStepTitle()}</h3>
                <span className="text-sm text-muted-foreground">
                  {currentStep === 'notes' ? 'Step 1 of 2' : 
                   currentStep === 'feedback' ? 'Step 2 of 2' : 
                   'Complete'}
                </span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className={currentStep === 'notes' ? 'font-medium text-gray-900' : ''}>
                  Notes
                </span>
                {userType === 'patient' && (
                  <span className={currentStep === 'feedback' ? 'font-medium text-gray-900' : ''}>
                    Feedback
                  </span>
                )}
                <span className={currentStep === 'completed' ? 'font-medium text-gray-900' : ''}>
                  Complete
                </span>
              </div>
            </div>

            {/* Session Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {userType === 'patient' ? 'Therapist' : 'Patient'}
                      </p>
                      <p className="font-medium">
                        {(() => {
                          const displayName = userType === 'patient' 
                            ? (sessionData.therapist?.full_name || '').trim()
                            : (sessionData.user?.full_name || '').trim();
                          console.log('🎯 Display name logic:', {
                            userType,
                            therapistData: sessionData.therapist,
                            userData: sessionData.user,
                            displayName,
                            rawTherapistName: sessionData.therapist?.full_name,
                            rawUserName: sessionData.user?.full_name
                          });
                          return displayName || 'Unknown';
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{sessionData.duration_minutes || sessionData.duration || 30} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
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
                sessionId={sessionId!}
                userType={userType}
                onNotesSaved={handleNotesSaved}
              />
            )}

            {currentStep === 'feedback' && (
              <SessionFeedback
                sessionId={sessionId!}
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
                  <p className="text-muted-foreground mb-6">
                    Thank you for completing the post-session review. Your feedback helps us improve our services.
                  </p>
                  
                  {/* Therapist: Schedule Next Session Option */}
                  {userType === 'therapist' && sessionData && (
                    <>
                      <Alert className="border-brand-gold bg-brand-gold/10 mb-6">
                        <Calendar className="h-4 w-4 text-brand-gold" />
                        <AlertDescription className="text-gray-900 text-left">
                          <strong>Continue Care:</strong> Schedule the next session with {sessionData.user?.full_name} 
                          to maintain continuity in their treatment.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={handleScheduleNextClick}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Next Session
                        </Button>
                        <Button 
                          onClick={handleComplete} 
                          size="lg"
                          variant="outline"
                        >
                          <Home className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {/* Patient: Just close button */}
                  {userType === 'patient' && (
                    <Button onClick={handleComplete} size="lg">
                      <Home className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

