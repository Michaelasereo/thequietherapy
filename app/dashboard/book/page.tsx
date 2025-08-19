"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BookingProgress from "@/components/booking-progress"
import BookingStep1 from "@/components/booking-step-1"
import BookingStep2 from "@/components/booking-step-2"
import BookingStep3 from "@/components/booking-step-3"
import { usePatientData } from "@/hooks/usePatientData"

// Types for the booking data
interface PatientBiodata {
  firstName: string
  email: string
  phone: string
  country: string
  complaints: string
  age: string
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Other"
  therapistGenderPreference?: string
  therapistSpecializationPreference?: string
}

export default function DashboardBookingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { biodata, loading, errors, refreshBiodata } = usePatientData()
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
  const [showBiodataPrompt, setShowBiodataPrompt] = useState(false)

  const stepLabels = ["Contact Info", "Select Therapist", "Payment"]

  // Load biodata on mount and auto-fill if available
  useEffect(() => {
    refreshBiodata()
  }, [refreshBiodata])

  // Auto-fill patient data from biodata when available
  useEffect(() => {
    if (biodata) {
      const hasContactInfo = biodata.firstName && biodata.email && biodata.phone && biodata.country
      
      if (hasContactInfo) {
        setPatientData({
          firstName: biodata.firstName || "",
          email: biodata.email || "",
          phone: biodata.phone || "",
          country: biodata.country || "",
          complaints: biodata.complaints || "",
          age: biodata.age?.toString() || "",
          gender: biodata.sex === 'male' ? 'Male' : biodata.sex === 'female' ? 'Female' : 'Prefer not to say',
          maritalStatus: biodata.marital_status === 'single' ? 'Single' : 
                        biodata.marital_status === 'married' ? 'Married' : 
                        biodata.marital_status === 'divorced' ? 'Divorced' : 
                        biodata.marital_status === 'widowed' ? 'Widowed' : 'Other',
          therapistGenderPreference: biodata.therapist_gender_preference || "no-preference",
          therapistSpecializationPreference: biodata.therapist_specialization_preference || "no-preference",
        })
        setShowBiodataPrompt(false)
      } else {
        setShowBiodataPrompt(true)
      }
    }
  }, [biodata])

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
    
    // Show success toast
    toast({
      title: "Booking Successful! 🎉",
      description: "Your therapy session has been booked successfully. You'll receive a confirmation email shortly.",
    })
    
    // Redirect back to dashboard
    router.push("/dashboard")
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
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar with Back Button */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {stepLabels.length}
        </div>
      </div>
      
      <BookingProgress
        currentStep={currentStep}
        totalSteps={stepLabels.length}
        labels={stepLabels}
      />

      {/* Biodata Prompt Alert */}
      {showBiodataPrompt && currentStep === 1 && (
        <div className="max-w-2xl mx-auto mb-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Complete your profile first!</strong> To make booking easier, please fill out your{" "}
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
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {currentStep === 1 && "Enter your contact information"}
              {currentStep === 2 && "Choose your therapist"}
              {currentStep === 3 && "Complete your booking"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
