"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import BookingProgress from "@/components/booking-progress"
import BookingStep1 from "@/components/booking-step-1"
import BookingStep2 from "@/components/booking-step-2"
import BookingStep3 from "@/components/booking-step-3"
import BookingStep4 from "@/components/booking-step-4"
import EmailVerificationModal from "@/components/email-verification-modal"
import { TimeSlot } from "@/lib/services/availabilityService"

// Types for the booking data
interface PatientBiodata {
  firstName: string
  email: string
  phone?: string
  country: string
  complaints: string
  age: string
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Other"
  therapistGenderPreference?: string
  therapistSpecializationPreference?: string
}

function BookSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [patientData, setPatientData] = useState<PatientBiodata>({
    firstName: "",
    email: "",
    phone: "",
    country: "",
    complaints: "",
    age: "",
    gender: "Male",
    maritalStatus: "Single",
    therapistGenderPreference: "no-preference",
    therapistSpecializationPreference: "no-preference",
  })
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [therapistInfo, setTherapistInfo] = useState<any>(null)

  const stepLabels = ["Contact Info", "Select Therapist", "Select Time", "Payment"]

  // Check for payment success from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const email = searchParams.get('email')
    
    if (paymentStatus === 'success' && email) {
      // Show verification modal
      setPatientData(prev => ({ ...prev, email: decodeURIComponent(email) }))
      setShowVerificationModal(true)
      
      // Clean up URL
      window.history.replaceState({}, '', '/book-session')
    }
  }, [searchParams])

  const handleStep1Complete = (data: PatientBiodata) => {
    setPatientData(data)
    setCurrentStep(2)
  }

  const handleStep2Complete = async (therapistId: string) => {
    setSelectedTherapistId(therapistId)
    
    // Fetch therapist info for step 3
    try {
      const response = await fetch(`/api/therapists/${therapistId}`)
      const data = await response.json()
      if (data.success) {
        setTherapistInfo(data.therapist)
      }
    } catch (error) {
      console.error('Error fetching therapist info:', error)
    }
    
    setCurrentStep(3)
  }

  const handleStep3Complete = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setCurrentStep(4)
  }

  const handleStep4Complete = async () => {
    // Handle booking completion - store booking data and send verification email
    console.log("Booking completed:", { patientData, selectedTherapistId, selectedSlot })
    
    try {
      // Call API to store booking and send verification email
      const response = await fetch('/api/bookings/create-guest-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData,
          therapistId: selectedTherapistId,
          slot: selectedSlot,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        // Show verification modal
        setShowVerificationModal(true)
      } else {
        console.error('Failed to create booking:', result.error)
        // Still show the modal as payment was successful
        setShowVerificationModal(true)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      // Still show the modal as payment was successful
      setShowVerificationModal(true)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push("/dashboard")
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
      case 4:
        return (
          <BookingStep4
            onBack={() => setCurrentStep(3)}
            onCheckout={handleStep4Complete}
            selectedTherapistId={selectedTherapistId}
            selectedSlot={selectedSlot!}
            therapistInfo={therapistInfo}
            patientData={patientData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                <Logo size="sm" variant="dark" />
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {stepLabels.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <BookingProgress
        currentStep={currentStep}
        totalSteps={stepLabels.length}
        labels={stepLabels}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">
                {currentStep === 1 && "Enter your contact information"}
                {currentStep === 2 && "Choose your therapist"}
                {currentStep === 3 && "Select available time"}
                {currentStep === 4 && "Complete your booking"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={patientData.email}
      />
    </div>
  )
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600">Loading booking page...</p>
        </div>
      </div>
    }>
      <BookSessionContent />
    </Suspense>
  )
}
