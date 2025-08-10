"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Brain } from "lucide-react"
import Link from "next/link"
import BookingProgress from "@/components/booking-progress"
import BookingStep1 from "@/components/booking-step-1"
import BookingStep2 from "@/components/booking-step-2"
import BookingStep3 from "@/components/booking-step-3"

// Types for the booking data
interface PatientBiodata {
  name: string
  complaints: string
  age: string
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Other"
  therapistPreference?: string
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
  })
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")

  const stepLabels = ["Patient Biodata", "Select Therapist", "Payment"]

  const handleStep1Complete = (data: PatientBiodata) => {
    setPatientData(data)
    setCurrentStep(2)
  }

  const handleStep2Complete = (therapistId: string) => {
    setSelectedTherapistId(therapistId)
    setCurrentStep(3)
  }

  const handleStep3Complete = () => {
    // Handle booking completion
    console.log("Booking completed:", { patientData, selectedTherapistId })
    
    // For demo purposes, redirect to dashboard
    router.push("/dashboard")
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
            onCheckout={handleStep3Complete}
            selectedTherapistId={selectedTherapistId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                <Brain className="h-6 w-6 text-primary" />
                Trpi
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
                {currentStep === 3 && "Complete your booking"}
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
