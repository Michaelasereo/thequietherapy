"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { StatefulButton } from "@/components/ui/stateful-button"
import { StatefulStatsCard } from "@/components/ui/stateful-card"
import { CalendarIcon, Video as VideoIcon, CheckCircle, CheckCircle2, TrendingUp, Clock, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BookingProgress from "@/components/booking-progress"
import BookingStep1 from "@/components/booking-step-1"
import BookingStep2 from "@/components/booking-step-2"
import BookingStep3 from "@/components/booking-step-3"
import { useDashboard } from "@/context/dashboard-context"
import { useNotificationState } from "@/hooks/useDashboardState"
import { useCrossDashboardBroadcast } from '@/hooks/useCrossDashboardSync';
import { useAuth } from '@/context/auth-context'
import { usePatientData } from "@/hooks/usePatientData"

// Authentication check component
function AuthCheck({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'error'>('loading')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAuthState('authenticated')
            return
          }
        }
        
        // Add a small delay before redirect to avoid race conditions
        setTimeout(() => {
          router.push('/login')
        }, 100)
        
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthState('error')
      }
    }

    // Add a longer delay to ensure cookie is set and server is ready
    setTimeout(() => {
      checkAuth()
    }, 500)
  }, [router])

  if (authState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Authentication Error</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (authState === 'authenticated') {
    return <>{children}</>
  }

  return null
}

// Twitter-style verification badge component
function TwitterVerifiedBadge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main circle with zigzag edge effect */}
      <path
        d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"
        fill="#000000"
      />
      {/* Zigzag pattern overlay */}
      <path
        d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20C6.486 21 2 16.514 2 11S6.486 1 12 1s10 4.486 10 10-4.486 10-10 10z"
        fill="none"
        stroke="#000000"
        strokeWidth="0.5"
        strokeDasharray="1,1"
      />
      {/* Inner zigzag pattern */}
      <path
        d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18C7.589 20 4 16.411 4 12s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
        fill="none"
        stroke="#000000"
        strokeWidth="0.3"
        strokeDasharray="0.5,0.5"
      />
      {/* Checkmark */}
      <path
        d="M9.5 12.5L11 14L14.5 10.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Video(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

function DashboardContent() {
  console.log('🔍 DashboardContent: Component rendered')
  
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { state, fetchSessions } = useDashboard()
  const { addSuccessNotification } = useNotificationState()
  const { user } = useAuth() // Get user from AuthContext instead of DashboardContext
  const { biodata, loading, refreshBiodata } = usePatientData()
  // const { broadcastEvent } = useCrossDashboardBroadcast();
  
  // Booking state
  const [showBooking, setShowBooking] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [patientData, setPatientData] = useState({
    firstName: "",
    email: "",
    phone: "",
    country: "",
    complaints: "",
    age: "",
    gender: "Male" as "Male" | "Female" | "Non-binary" | "Prefer not to say",
    maritalStatus: "Single" as "Single" | "Married" | "Divorced" | "Widowed" | "Other",
    therapistGenderPreference: "no-preference",
    therapistSpecializationPreference: "no-preference",
  })
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")
  const [showBiodataPrompt, setShowBiodataPrompt] = useState(false)
  
  // Default data for new users
  const defaultStats = {
    totalSessions: 0,
    upcomingSessions: 0,
    progressScore: 0,
    averageSessionTime: 0,
    totalCredits: 10,
    usedCredits: 0,
  }

  const defaultSessions: any[] = []

  // Dashboard summary cards data
  const dashboardSummaryCards = [
    {
      title: "Total Sessions",
      value: (state.upcomingSessions?.length || 0) + (state.pastSessions?.length || 0),
      description: "All time sessions",
      icon: CheckCircle2,
    },
    {
      title: "Upcoming Sessions",
      value: state.upcomingSessions?.length || 0,
      description: "Scheduled sessions",
      icon: Clock,
    },
    {
      title: "Progress Score",
      value: `${Math.min(100, Math.max(0, (state.pastSessions?.length || 0) * 10))}%`,
      description: "Your therapy progress",
      icon: TrendingUp,
    },
    {
      title: "Available Credits",
      value: state.user?.credits || 1,
      description: "Credits remaining",
      icon: CheckCircle,
    },
  ]

  useEffect(() => {
    // Check for success parameter from booking flow
    const success = searchParams.get('success')
    if (success === 'true') {
      addSuccessNotification(
        "Booking Successful! 🎉",
        "Your therapy session has been booked successfully. You'll receive a confirmation email shortly."
      )
    }
  }, [searchParams, addSuccessNotification])

  // Check for payment status in URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your payment has been processed successfully. Your session has been booked!",
      })
      // Refresh sessions to show the new booking
      fetchSessions()
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      })
    } else if (paymentStatus === 'error') {
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  // Load biodata and check if user needs to complete profile
  useEffect(() => {
    refreshBiodata()
  }, [refreshBiodata])

  useEffect(() => {
    if (biodata && !loading.biodata) {
      const hasContactInfo = biodata.firstName && biodata.email && biodata.phone && biodata.country
      
      // Check if user was recently approved (within 24 hours)
      const approvalDate = biodata.approved_at ? new Date(biodata.approved_at) : null
      const now = new Date()
      const isRecentlyApproved = approvalDate && (now.getTime() - approvalDate.getTime()) < 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      
      // Show prompt only if user doesn't have contact info AND was recently approved
      setShowBiodataPrompt(!hasContactInfo && !!isRecentlyApproved)
    }
  }, [biodata, loading.biodata])

  const format = (date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Booking handlers
  const handleStartBooking = () => {
    setShowBooking(true)
    setCurrentStep(1)
  }

  const handleStep1Complete = (data: any) => {
    setPatientData(data)
    setCurrentStep(2)
  }

  const handleStep2Complete = (therapistId: string) => {
    setSelectedTherapistId(therapistId)
    setCurrentStep(3)
  }

  const handleStep3Complete = () => {
    console.log("Booking completed:", { patientData, selectedTherapistId })
    
    toast({
      title: "Booking Successful! 🎉",
      description: "Your therapy session has been booked successfully. You'll receive a confirmation email shortly.",
    })
    
    setShowBooking(false)
    setCurrentStep(1)
    fetchSessions()
  }

  const handleBackFromBooking = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      setShowBooking(false)
      setCurrentStep(1)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingStep1
            onNext={handleStep1Complete}
            initialData={patientData}
          />
        )
      case 2:
        return (
          <BookingStep2
            onNext={handleStep2Complete}
            onBack={() => setCurrentStep(1)}
            initialSelectedTherapistId={selectedTherapistId}
          />
        )
      case 3:
        return (
          <BookingStep3
            onBack={() => setCurrentStep(2)}
            onNext={handleStep3Complete}
            selectedTherapistId={selectedTherapistId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="grid gap-6">
      {!showBooking ? (
        // Dashboard View
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome, {(() => {
                    try {
                      if (user && typeof user === 'object' && user.full_name && typeof user.full_name === 'string') {
                        const firstName = user.full_name.trim().split(' ')[0];
                        return firstName || 'User';
                      }
                      return 'User';
                    } catch (error) {
                      console.error('Error parsing user name:', error);
                      return 'User';
                    }
                  })()}
                </h1>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                  Individual
                </span>
              </div>
            </div>
            <Button onClick={handleStartBooking}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Book a Session
            </Button>
          </div>

          {/* Biodata Prompt */}
          {showBiodataPrompt && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Complete your profile!</strong> To make booking easier and get personalized recommendations, please fill out your{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-800 underline"
                  onClick={() => router.push("/dashboard/biodata")}
                >
                  personal information
                </Button>{" "}
                in your dashboard. This will auto-fill your booking forms in the future.
              </AlertDescription>
            </Alert>
          )}

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardSummaryCards.map((card, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Upcoming Sessions and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {(state.upcomingSessions || defaultSessions).length > 0 ? (
              <div className="space-y-4">
                {(state.upcomingSessions || defaultSessions).map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">
                        {format(new Date(session.date), "PPP")} at {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.therapist} • {session.topic}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      {session.dailyRoomUrl && (
                        <Button variant="outline" size="sm" className="bg-transparent" asChild>
                          <a href={session.dailyRoomUrl} target="_blank" rel="noopener noreferrer">
                            <VideoIcon className="mr-2 h-4 w-4" /> Join Video
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="bg-transparent" asChild>
                        <Link href={`/video-call?room=${session.id}&participant=${encodeURIComponent('User')}`}>
                          <VideoIcon className="mr-2 h-4 w-4" /> Join Session
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {(state.pastSessions || []).length > 0 ? (
            <div className="space-y-4">
              {(state.pastSessions || []).map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/30">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div className="grid gap-0.5">
                    <p className="font-medium">
                      {format(new Date(session.date), "PPP")} at {session.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.therapist} • {session.topic}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm text-green-600 font-medium">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No past sessions found.</p>
          )}
        </CardContent>
      </Card>

      {/* Notifications / Important Updates section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notifications & Important Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            {state.upcomingSessions && state.upcomingSessions.length > 0 ? (
              <p>• Reminder: Your next session is scheduled for {format(new Date(state.upcomingSessions[0].date), "PPP")}.</p>
            ) : (
              <p>• No upcoming sessions scheduled. Book your first session to get started!</p>
            )}
            <p>• New feature: Enhanced session notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
            {user && user.credits < 2 && (
              <p>• Low credits alert: You have {user.credits} credits remaining. Consider purchasing more credits.</p>
            )}
          </div>
        </CardContent>
      </Card>
        </>
      ) : (
        // Booking View
        <>
          {/* Progress Bar with Back Button */}
          <div className="flex items-center justify-between mb-4 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackFromBooking}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 3
            </div>
          </div>
          
          <BookingProgress
            currentStep={currentStep}
            totalSteps={3}
            labels={["Patient Biodata", "Select Therapist", "Payment"]}
          />

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">
                  {currentStep === 1 && "Tell us about yourself"}
                  {currentStep === 2 && "Choose your therapist"}
                  {currentStep === 3 && "Complete your booking"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderCurrentStep()}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  console.log('🔍 DashboardPage: Main component rendered')
  
  return (
    <AuthCheck>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </AuthCheck>
  )
}
