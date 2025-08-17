"use client"

import { useState, useEffect, startTransition } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, ArrowLeft, Shield, Users, Clock, DollarSign, Star, Award, Heart } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Step1BasicDetails from "@/components/therapist-enrollment-steps/step-1-basic-details"
import Step2DocumentVerification from "@/components/therapist-enrollment-steps/step-2-document-verification"
import Step3SpecializationLanguages from "@/components/therapist-enrollment-steps/step-3-specialization-languages"
import Step4TermsConditions from "@/components/therapist-enrollment-steps/step-4-terms-conditions"
import BookingProgress from "@/components/booking-progress"
import { useActionState } from "react"
import { therapistEnrollAction } from "@/actions/therapist-auth"
import { useToast } from "@/components/ui/use-toast"

export default function TherapistEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [enrollmentEmail, setEnrollmentEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState({ canEnroll: true, message: '', redirectTo: '' })
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
    console.log("State changed:", state)
    
    if (state?.error) {
      console.log("Error state detected:", state.error)
      toast({
        title: "Enrollment Failed",
        description: state.error,
        variant: "destructive",
      })
    } else if (state?.success) {
      console.log("Success state detected, showing modal")
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
    // Check if email validation allows enrollment
    if (!emailStatus.canEnroll) {
      toast({
        title: "Cannot Proceed",
        description: emailStatus.message,
        variant: "destructive",
      })
      return
    }

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
        return <Step1BasicDetails 
          onNext={handleNext} 
          initialData={formData} 
          onEmailStatusChange={setEmailStatus}
        />
      case 2:
        return <Step2DocumentVerification onNext={handleNext} onBack={handleBack} initialData={formData} />
      case 3:
        return <Step3SpecializationLanguages onNext={handleNext} onBack={handleBack} initialData={formData} />
      case 4:
        return <Step4TermsConditions 
          onBack={handleBack} 
          onSubmit={handleSubmit} 
          isSubmitting={isPending} 
          canEnroll={emailStatus.canEnroll}
        />
      default:
        return null
    }
  }

  const stepLabels = ["Basic Details", "Document Verification", "Specialization & Languages", "Terms & Conditions"]

  return (
    <div className="min-h-screen flex">
      {/* Back Button */}
      <div className="absolute top-6 right-6 z-20">
        <Button asChild variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Left Section - Black Background with Therapist Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Therapist Benefits Demo */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Earnings Potential Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Earnings Potential</span>
                      <DollarSign className="h-4 w-4 text-green-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">₦3,000 - ₦5,000 per session</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Flexible scheduling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Weekly payments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Benefits Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Platform Benefits</span>
                      <Award className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Secure video calls</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Client management tools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Flexible hours</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Stories Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Heart className="h-4 w-4 text-pink-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Dr. Sarah Johnson</div>
                        <div className="text-xs opacity-75">4.9★ rating</div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75">
                      "Trpi has transformed my practice. I can help more people while maintaining work-life balance."
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Join Our Network</h2>
            <p className="text-gray-300 leading-relaxed">
              Become part of Nigeria's leading mental health platform. Help people heal, grow, and thrive 
              while building a rewarding career with flexible hours and competitive earnings.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Verified Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Growing Community</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Flexible Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Enrollment Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Therapist Enrollment</h1>
            <p className="text-gray-600">Join our network of compassionate therapists</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <BookingProgress currentStep={currentStep} totalSteps={4} labels={stepLabels} />
          </div>

          {/* Enrollment Form */}
          <Card className="w-full">
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <span>© 2024 Quiet. All rights reserved.</span>
          </div>
        </div>
      </div>

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
