"use client"

import { useState, useEffect, startTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import Step1BasicDetails from "@/components/therapist-enrollment-steps/step-1-basic-details"
import Step2DocumentVerification from "@/components/therapist-enrollment-steps/step-2-document-verification"
import Step3SpecializationLanguages from "@/components/therapist-enrollment-steps/step-3-specialization-languages"
import Step4TermsConditions from "@/components/therapist-enrollment-steps/step-4-terms-conditions"
import BookingProgress from "@/components/booking-progress" // Reusing the progress component
import { useActionState } from "react"
import { therapistEnrollAction } from "@/actions/therapist-auth"
import { useToast } from "@/components/ui/use-toast"

export default function TherapistEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [enrollmentEmail, setEnrollmentEmail] = useState("")
  const [formData, setFormData] = useState<any>({
    fullName: "",
    email: "",
    phone: "",
    mdcnCode: "",
    specialization: [],
    languages: [],
    termsAccepted: false
  })
  const { toast } = useToast()

  const [state, formAction, isPending] = useActionState(therapistEnrollAction, null)

  // Handle state changes from the server action
  useEffect(() => {
    console.log("State changed:", state) // Debug log
    
    if (state?.error) {
      console.log("Error state detected:", state.error) // Debug log
      toast({
        title: "Enrollment Failed",
        description: state.error,
        variant: "destructive",
      })
    } else if (state?.success) {
      console.log("Success state detected, showing modal") // Debug log
      setEnrollmentEmail(formData.email)
      setShowSuccessModal(true)
      toast({
        title: "Enrollment Successful!",
        description: "Please check your email to complete the process.",
      })
    }
  }, [state, toast, formData.email])

  const handleNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async (data: any) => {
    const finalData = { ...formData, ...data }
    console.log("Final Enrollment Data:", finalData)

    // Prepare FormData for the server action
    const submitFormData = new FormData()
    for (const key in finalData) {
      if (Array.isArray(finalData[key])) {
        finalData[key].forEach((item: any) => submitFormData.append(key, item))
      } else if (key === "idUpload" && finalData[key] instanceof FileList) {
        // Handle FileList for file uploads
        if (finalData[key].length > 0) {
          submitFormData.append(key, finalData[key][0]) // Append the first file
        }
      } else {
        submitFormData.append(key, finalData[key])
      }
    }

    console.log("FormData entries:")
    for (let [key, value] of submitFormData.entries()) {
      console.log(`${key}:`, value)
    }

    console.log("Calling formAction...")
    // Call the server action using startTransition
    startTransition(() => {
      formAction(submitFormData)
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicDetails onNext={handleNext} initialData={formData} />
      case 2:
        return <Step2DocumentVerification onNext={handleNext} onBack={handleBack} initialData={formData} />
      case 3:
        return <Step3SpecializationLanguages onNext={handleNext} onBack={handleBack} initialData={formData} />
      case 4:
        return <Step4TermsConditions onBack={handleBack} onSubmit={handleSubmit} isSubmitting={isPending} />
      default:
        return null
    }
  }

  const stepLabels = ["Basic Details", "Document Verification", "Specialization & Languages", "Terms & Conditions"]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Therapist Enrollment</CardTitle>
          <CardDescription>Join our network of compassionate therapists.</CardDescription>
        </CardHeader>
        <BookingProgress currentStep={currentStep} totalSteps={4} labels={stepLabels} />
        <CardContent className="p-0">{renderStep()}</CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Enrollment Submitted Successfully!
            </DialogTitle>
            <DialogDescription>
              We've sent a verification email to complete your enrollment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Check Your Email</p>
                <p className="text-sm text-blue-700">{enrollmentEmail}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📧 Look for an email from Trpi</p>
              <p>🔗 Click the verification link in the email</p>
              <p>✅ Complete your account setup</p>
              <p>⏳ Your application will be reviewed by our admin team</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowSuccessModal(false)} 
                className="flex-1"
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => window.location.href = "/therapist/login"} 
                className="flex-1"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
