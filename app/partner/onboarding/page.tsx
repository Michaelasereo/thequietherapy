"use client"

import { useState, useEffect, startTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Building2, ArrowLeft, ArrowRight, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { partnerOnboardingAction } from "@/actions/partner-auth"

const institutionTypes = [
  "Hospital",
  "Clinic", 
  "NGO",
  "School",
  "Corporate HR",
  "Government Agency",
  "Other"
]

export default function PartnerOnboardingPage() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [state, formAction, isPending] = useActionState(partnerOnboardingAction, null)
  const [formData, setFormData] = useState({
    organizationName: "",
    institutionType: "",
    website: "",
    address: "",
    phone: "",
    email: "",
    licenseNumber: "",
    acceptTerms: false,
    acceptPrivacy: false,
    contactName: "",
    employeeCount: "",
    industry: ""
  })

  const progress = (currentStep / 2) * 100

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    console.log("🔍 handleNext called for step:", currentStep)
    console.log("📋 Current form data:", formData)
    
    if (currentStep === 1) {
      console.log("🔍 Validating step 1 fields...")
      console.log("  organizationName:", formData.organizationName)
      console.log("  institutionType:", formData.institutionType)
      console.log("  email:", formData.email)
      console.log("  contactName:", formData.contactName)
      console.log("  employeeCount:", formData.employeeCount)
      
      // Check only the fields that are actually filled in step 1
      if (!formData.organizationName || !formData.institutionType || !formData.email || !formData.contactName || !formData.employeeCount) {
        console.log("❌ Step 1 validation failed")
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields marked with *.",
          variant: "destructive",
        })
        return
      }
      console.log("✅ Step 1 validation passed")
      
      // Move to next step
      console.log("🔄 Moving to next step:", currentStep + 1)
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle form state with useEffect to avoid setState during render
  useEffect(() => {
    if (state?.success && !showSuccessModal) {
      setShowSuccessModal(true)
      toast({
        title: "Onboarding Initiated!",
        description: state.success,
      })
    }

    if (state?.error) {
      toast({
        title: "Onboarding Failed",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, showSuccessModal])

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Images */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <Building2 className="h-24 w-24 text-primary mx-auto" />
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Trpi</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Join our network of healthcare institutions providing accessible mental health support
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Partner Institutions</div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Onboarding Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/partner/auth">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex-1">
                <CardTitle className="text-xl">Partner Onboarding</CardTitle>
                <p className="text-sm text-muted-foreground">Step {currentStep} of 2</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

            <CardContent className="space-y-6">
              {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Institution Profile Setup</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    placeholder="Enter your organization name"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleNext()
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionType">Type *</Label>
                  <Select value={formData.institutionType} onValueChange={(value) => handleInputChange("institutionType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution type" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Official Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://your-institution.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your institution address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@yourcompany.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleNext()
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 XXX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Person Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="Full name of contact person"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Number of Employees *</Label>
                    <Select value={formData.employeeCount} onValueChange={(value) => handleInputChange("employeeCount", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Privacy Note:</strong> We collect only essential details to verify your institution. 
                    All information is stored securely and encrypted in line with Nigerian Data Protection Regulation (NDPR).
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy & Service Agreement</h3>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What Happens Here:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Institution reviews Privacy Policy (aligned with NDPR & HIPAA-equivalent principles)</li>
                      <li>• Accept Terms of Service</li>
                      <li>• Assign an Institution Admin to manage access rights and approve/revoke therapist profiles</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                      />
                      <Label htmlFor="acceptTerms" className="text-sm">
                        I accept the <a href="#" className="text-primary hover:underline">Terms of Service</a>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptPrivacy"
                        checked={formData.acceptPrivacy}
                        onCheckedChange={(checked) => handleInputChange("acceptPrivacy", checked as boolean)}
                      />
                      <Label htmlFor="acceptPrivacy" className="text-sm">
                        I accept the <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                      </Label>
                    </div>
                  </div>



                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Privacy Note:</strong> Your institution retains full control of data access. 
                      All therapy session notes and client data remain confidential between therapist and client 
                      unless explicit written consent is provided.
                    </p>
                  </div>
                </div>
              </div>
            )}



            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentStep < 2 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={isPending}
                  onClick={async (e) => {
                    // Validate step 2 before submitting
                    if (!formData.acceptTerms || !formData.acceptPrivacy) {
                      toast({
                        title: "Missing required fields",
                        description: "Please accept terms and privacy policy.",
                        variant: "destructive",
                      })
                      return
                    }
                    
                    // Create FormData and submit manually
                    const formDataToSubmit = new FormData()
                    formDataToSubmit.append('organizationName', formData.organizationName)
                    formDataToSubmit.append('contactName', formData.contactName)
                    formDataToSubmit.append('email', formData.email)
                    formDataToSubmit.append('employeeCount', formData.employeeCount)
                    formDataToSubmit.append('industry', formData.institutionType)
                    formDataToSubmit.append('termsAccepted', formData.acceptTerms ? 'on' : '')
                    formDataToSubmit.append('address', formData.address)
                    formDataToSubmit.append('phone', formData.phone)
                    
                    console.log("🔍 Manual form submission triggered")
                    console.log("📋 Form data being submitted:")
                    console.log("  organizationName:", formData.organizationName)
                    console.log("  contactName:", formData.contactName)
                    console.log("  email:", formData.email)
                    console.log("  employeeCount:", formData.employeeCount)
                    console.log("  industry:", formData.institutionType)
                    console.log("  termsAccepted:", formData.acceptTerms)
                    console.log("  address:", formData.address)
                    console.log("  phone:", formData.phone)
                    
                    // Call the server action directly within startTransition
                    startTransition(() => {
                      formAction(formDataToSubmit)
                    })
                  }}
                >
                  {isPending ? "Sending..." : "Submit"}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-center">Email Verification Required</h3>
            
            <div className="space-y-4">
              <p className="text-muted-foreground text-center">
                Please check your email ({formData.email}) for verification instructions.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Next Steps:</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>1. Click the verification link in your email</li>
                  <li>2. Complete email verification</li>
                  <li>3. Schedule onboarding meeting with our team</li>
                  <li>4. Get approved and access your dashboard</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> After verification, a meeting will be set up by our company admin/representative 
                  to discuss onboarding before verification is approved and you can enjoy all the benefits.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
