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
import { useAuth } from "@/context/auth-context"

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

export default function DashboardBookingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
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
  const [selectedTherapistData, setSelectedTherapistData] = useState<any>(null)
  const [showBiodataPrompt, setShowBiodataPrompt] = useState(false)

  const stepLabels = ["Contact Info", "Select Therapist", "Payment"]

  // Load biodata on mount and auto-fill if available
  useEffect(() => {
    refreshBiodata()
  }, [refreshBiodata])

  // Auto-fill patient data from user signup data and biodata when available
  useEffect(() => {
    // First, pre-fill with user's signup data (name and email)
    if (user) {
      setPatientData(prev => ({
        ...prev,
        firstName: user.full_name || "",
        email: user.email || "",
      }))
    }

    // Then, if biodata is available, use it to fill additional fields
    if (biodata) {
      const hasContactInfo = biodata.firstName && biodata.email && biodata.country
      
      if (hasContactInfo) {
        setPatientData(prev => ({
          ...prev,
          firstName: biodata.firstName || prev.firstName,
          email: biodata.email || prev.email,
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
        }))
        setShowBiodataPrompt(false)
      } else {
        setShowBiodataPrompt(true)
      }
    }
  }, [user, biodata])

  const handleStep1Complete = (data: PatientBiodata) => {
    setPatientData(data)
    setCurrentStep(2)
  }

  const handleStep2Complete = (therapistId: string, therapistData?: any) => {
    setSelectedTherapistId(therapistId)
    setSelectedTherapistData(therapistData)
    setCurrentStep(3)
  }

  const handleStep3Complete = async (selectedSlot: any) => {
    try {
      // Handle booking completion
      console.log("Booking completed:", { patientData, selectedTherapistId, selectedSlot })
      
      // Check if booking was already completed in the BookingConfirmation component
      if (selectedSlot.bookingAlreadyComplete) {
        console.log("✅ Booking already completed in BookingConfirmation, skipping duplicate API call and redirecting...")
        console.log("✅ Confirmation data:", selectedSlot.confirmation)
        // Redirect to dashboard therapy page to see the new session
        router.push("/dashboard/therapy")
        return
      }
      
      // Create the session record
      const sessionData = {
        therapist_id: selectedTherapistId,
        session_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        duration: selectedSlot.session_duration || 60,
        session_type: selectedSlot.session_type === 'individual' ? 'video' : selectedSlot.session_type || 'video',
        notes: `Patient: ${patientData.firstName} (${patientData.email})${patientData.phone ? `, Phone: ${patientData.phone}` : ''}, Concerns: ${patientData.complaints || 'N/A'}`
      }

      // Call the booking API
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      const result = await response.json()

      if (result.success) {
        // Show success toast
        toast({
          title: "Booking Successful! 🎉",
          description: "Your therapy session has been booked successfully. You'll receive a confirmation email shortly.",
        })
        
        // Redirect to dashboard therapy page to see the new session
        router.push("/dashboard/therapy")
      } else {
        throw new Error(result.error || 'Failed to book session')
      }
    } catch (error) {
      console.error('Error booking session:', error)
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive"
      })
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
            userData={user ? { full_name: user.full_name, email: user.email } : undefined}
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
            selectedTherapistData={selectedTherapistData}
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
