"use client"

import { useState } from "react"
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
    licensedQualification: "",
    specialization: [],
    languages: [],
    termsAccepted: false
  })
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)

  const handleNext = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async (data: any) => {
    // Prevent duplicate submissions
    if (isPending) {
      console.warn('⚠️ Submission already in progress, ignoring duplicate request')
      return
    }

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

    // Handle profile image upload if provided
    const profileImageFile = finalData.profileImageFile as File | undefined
    
    // ✅ FIX: Extract ID document file from Step 2
    const idUploadFile = finalData.idUpload?.[0] as File | undefined
    
    console.log("Calling API route /api/therapist/enroll...")
    setIsPending(true)

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData()
      formDataToSend.append('email', finalData.email)
      formDataToSend.append('fullName', finalData.fullName)
      formDataToSend.append('phone', finalData.phone)
      formDataToSend.append('licensedQualification', finalData.licensedQualification)
      formDataToSend.append('specialization', JSON.stringify(finalData.specialization || []))
      formDataToSend.append('languages', JSON.stringify(finalData.languages || []))
      formDataToSend.append('gender', finalData.gender)
      formDataToSend.append('age', finalData.age)
      formDataToSend.append('maritalStatus', finalData.maritalStatus)
      formDataToSend.append('bio', finalData.bio)
      
      // Add profile image file if provided
      if (profileImageFile) {
        formDataToSend.append('profileImage', profileImageFile)
      }
      
      // ✅ FIX: Add ID document file if provided
      if (idUploadFile) {
        formDataToSend.append('idDocument', idUploadFile)
        console.log('📄 ID document included in form submission:', idUploadFile.name, idUploadFile.size, 'bytes')
      } else {
        console.warn('⚠️ No ID document found in form data')
      }

      const response = await fetch('/api/therapist/enroll', {
        method: 'POST',
        body: formDataToSend // Send as FormData to handle file upload
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        // Log full error details for debugging
        console.error("Enrollment error - Full response:", result)
        console.error("Enrollment error - Error code:", result.code)
        console.error("Enrollment error - Details:", result.details)
        console.error("Enrollment error - Debug info:", result.debug)
        
        // Show user-friendly error message
        const errorMessage = result.error || "Failed to submit enrollment. Please try again."
        toast({
          title: "Enrollment Failed",
          description: errorMessage,
          variant: "destructive",
        })
        setIsPending(false)
        return
      }

      console.log("Success state detected, showing modal")
      setEnrollmentEmail(formData.email)
      setShowSuccessModal(true)
      
      // Check if there was a magic link error (e.g., email already registered)
      if (result.magic_link_error) {
        toast({
          title: "Enrollment Successful!",
          description: result.message || "Enrollment saved but there was an issue with email verification.",
          variant: "default",
        })
      } else {
        toast({
          title: "Enrollment Successful!",
          description: "Please check your email to complete the process.",
        })
      }
      setIsPending(false)
    } catch (error) {
      console.error("Enrollment error:", error)
      toast({
        title: "Enrollment Failed",
        description: "An error occurred during enrollment. Please try again.",
        variant: "destructive",
      })
      setIsPending(false)
    }
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
                      "Quiet has transformed my practice. I can help more people while maintaining work-life balance."
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
              Check your email to access your dashboard.
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
              <p>📧 Look for an email with your dashboard access link</p>
              <p>🔗 Click the link to access your therapist dashboard</p>
              <p>👀 Your application is pending admin approval</p>
              <p>⏳ You'll be able to set availability once approved</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = "/"} 
                className="flex-1"
                variant="outline"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => setShowSuccessModal(false)} 
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
