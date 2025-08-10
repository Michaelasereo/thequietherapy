"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"
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
  const [formData, setFormData] = useState<any>({})
  const { toast } = useToast()

  const [state, formAction, isPending] = useActionState(therapistEnrollAction, null)

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

    // Call the server action
    await formAction(submitFormData)

    if (state?.error) {
      toast({
        title: "Enrollment Failed",
        description: state.error,
        variant: "destructive",
      })
    } else {
      // Server action handles redirect on success
      toast({
        title: "Enrollment Successful!",
        description: "Welcome to Trpi! Redirecting to your dashboard...",
      })
    }
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
          <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-2">
            <Brain className="h-7 w-7 text-primary" />
            Trpi (Therapist)
          </Link>
          <CardTitle className="text-2xl">Therapist Enrollment</CardTitle>
          <CardDescription>Join our network of compassionate therapists.</CardDescription>
        </CardHeader>
        <BookingProgress currentStep={currentStep} totalSteps={4} labels={stepLabels} />
        <CardContent className="p-0">{renderStep()}</CardContent>
      </Card>
    </div>
  )
}
