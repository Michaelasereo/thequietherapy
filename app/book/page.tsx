"use client"

import { useState, useCallback, useRef } from "react"
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
import BookingStep3Wrapper from "@/components/booking-step-3-wrapper"
import BookingStep4 from "@/components/booking-step-4"

// Types for the booking data
interface PatientBiodata {
  name: string
  complaints: string
  age: string
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Other"
  therapistPreference?: string
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

export default function BookingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [patientData, setPatientData] = useState<PatientBiodata>({
    name: "",
    complaints: "",
    age: "",
    gender: "Male",
    maritalStatus: "Single",
    therapistPreference: "",
    therapistGenderPreference: "",
    therapistSpecializationPreference: ""
  })
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [therapistInfo, setTherapistInfo] = useState<any>(null)

  const stepLabels = ["Patient Biodata", "Select Therapist", "Select Time", "Payment"]

  const handleStep1Complete = (data: any) => {
    // Convert the form data to match PatientBiodata structure
    const patientBiodata: PatientBiodata = {
      name: data.firstName || data.name || "",
      complaints: data.complaints || "",
      age: data.age || "",
      gender: data.gender || "Male",
      maritalStatus: data.maritalStatus || "Single",
      therapistPreference: data.therapistSpecializationPreference || "",
      therapistGenderPreference: data.therapistGenderPreference || "",
      therapistSpecializationPreference: data.therapistSpecializationPreference || ""
    }
    setPatientData(patientBiodata)
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

  const handleStep3Complete = useCallback((slot: TimeSlot) => {
    console.log('handleStep3Complete called with slot:', slot)
    setSelectedSlot(slot)
    setCurrentStep(4)
  }, [])

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
      router.push("/")
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingStep1
            onNext={handleStep1Complete}
            initialData={{
              firstName: patientData.name,
              email: "",
              phone: "",
              country: "",
              complaints: patientData.complaints,
              age: patientData.age,
              gender: patientData.gender,
              maritalStatus: patientData.maritalStatus,
              therapistGenderPreference: "no-preference",
              therapistSpecializationPreference: patientData.therapistPreference || "no-preference"
            }}
          />
        )
      case 2:
        return (
          <BookingStep2
            onNext={handleStep2Complete}
            onBack={() => setCurrentStep(1)}
            initialSelectedTherapistId={selectedTherapistId}
            preferredGender={patientData.therapistGenderPreference}
            preferredSpecialization={patientData.therapistSpecializationPreference}
          />
        )
      case 3:
        const step3Props = {
          onNext: handleStep3Complete,
          onBack: () => setCurrentStep(2),
          selectedTherapistId
        }
        
        console.log('Rendering BookingStep3 with props:', step3Props)
        console.log('onNext function:', handleStep3Complete)
        console.log('onNext type:', typeof handleStep3Complete)
        console.log('onNext toString:', handleStep3Complete?.toString())
        console.log('BookingStep3 component:', BookingStep3)
        
        if (!BookingStep3) {
          return (
            <div className="p-6 text-center">
              <p className="text-red-600">Error: BookingStep3 component not found</p>
            </div>
          )
        }
        
        if (!handleStep3Complete) {
          console.error('handleStep3Complete is undefined!')
          return (
            <div className="p-6 text-center">
              <p className="text-red-600">Error: handleStep3Complete function is undefined</p>
            </div>
          )
        }
        
        // Test with a simple div first to see if the function works
        const testFunction = (slot: TimeSlot) => {
          console.log('TEST FUNCTION CALLED with slot:', slot)
          alert('Test function works!')
          setSelectedSlot(slot)
          setCurrentStep(4)
        }
        
        console.log('Test function:', testFunction)
        console.log('Test function type:', typeof testFunction)
        
        return (
          <BookingStep3Wrapper
            selectedTherapistId={selectedTherapistId}
            onBack={() => setCurrentStep(2)}
            onComplete={handleStep3Complete}
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
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
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
                {currentStep === 1 && "Tell us about yourself"}
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
