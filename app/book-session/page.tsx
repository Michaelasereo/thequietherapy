"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

interface TimeSlot {
  id: string
  date: string
  day_name: string
  start_time: string
  end_time: string
  session_duration: number
  session_title: string
  session_type: 'individual' | 'group'
  is_available: boolean
}

export default function BookSessionPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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

  const handleStep4Complete = () => {
    // Handle booking completion
    console.log("Booking completed:", { patientData, selectedTherapistId, selectedSlot })
    
    // Redirect to authentication if not logged in, then dashboard
    router.push("/auth?redirect=/dashboard&success=true")
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
    </div>
  )
}
