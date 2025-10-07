"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, CheckCircle, ArrowLeft, Building, Users, Shield, Globe, Award } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function PartnerEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [enrollmentEmail, setEnrollmentEmail] = useState("")
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    phone: "",
    website: "",
    organizationType: "",
    numberOfEmployees: "",
    servicesOffered: [] as string[],
    targetAudience: [] as string[],
    partnershipGoals: "",
    termsAccepted: false
  })

  const handleNext = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (data: any) => {
    const finalData = { ...formData, ...data }
    console.log("Partner Enrollment Data:", finalData)
    
    try {
      // Send partner enrollment data to API
      const response = await fetch('/api/partner/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Partner enrollment successful, magic link sent")
        setEnrollmentEmail(formData.email)
        setShowSuccessModal(true)
      } else {
        console.error("Partner enrollment failed:", result.error)
        // Handle error - you might want to show an error message
        alert(`Enrollment failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error during partner enrollment:", error)
      alert("An error occurred during enrollment. Please try again.")
    }
  }

  const steps = [
    { id: 1, title: "Organization Details", icon: Building },
    { id: 2, title: "Business Information", icon: Globe },
    { id: 3, title: "Partnership Goals", icon: Award },
    { id: 4, title: "Terms & Conditions", icon: Shield }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Black Background with Partner Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Partner Benefits */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Partnership Benefits Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Partnership Benefits</span>
                      <Building className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Bulk user management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Analytics dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Priority support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Custom integration</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Tools Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Partnership Process</span>
                      <Award className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Application review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Verification process</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-blue-300" />
                        <span className="text-xs">Integration support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
            <p className="text-gray-300 leading-relaxed">
              Join our network of trusted partners and help us provide accessible mental health services to communities worldwide. 
              Get access to our comprehensive platform and management tools.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Organization</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">User Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Partner Enrollment Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner with Us</h1>
            <p className="text-gray-600">Join our network of trusted partners</p>
            <p className="text-sm text-blue-600 mt-1">Partnership Application</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Back to Login Link */}
          <div className="mb-6 text-center">
            <Link 
              href="/partner/login" 
              className="text-sm text-gray-500 hover:text-gray-800 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Already have an account? Sign in
            </Link>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Details</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Your organization name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationType">Organization Type *</Label>
                    <select
                      id="organizationType"
                      value={formData.organizationType}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select type</option>
                      <option value="healthcare">Healthcare Provider</option>
                      <option value="corporate">Corporate Wellness</option>
                      <option value="educational">Educational Institution</option>
                      <option value="nonprofit">Non-profit Organization</option>
                      <option value="government">Government Agency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@organization.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourorganization.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                    <select
                      id="numberOfEmployees"
                      value={formData.numberOfEmployees}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfEmployees: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select range</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleNext({})}
                    disabled={!formData.organizationName || !formData.email || !formData.phone || !formData.organizationType}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
                  <p className="text-gray-600">Tell us about your services and target audience</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Services You Offer (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "Mental Health Counseling",
                        "Employee Assistance Programs",
                        "Wellness Programs",
                        "Health Insurance",
                        "Educational Services",
                        "Community Outreach",
                        "Research & Development",
                        "Technology Solutions",
                        "Other"
                      ].map((service) => (
                        <label key={service} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.servicesOffered.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  servicesOffered: [...prev.servicesOffered, service]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  servicesOffered: prev.servicesOffered.filter(s => s !== service)
                                }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Target Audience (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "Employees",
                        "Students",
                        "Patients",
                        "Community Members",
                        "Healthcare Providers",
                        "Educators",
                        "Government Workers",
                        "General Public",
                        "Other"
                      ].map((audience) => (
                        <label key={audience} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.targetAudience.includes(audience)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  targetAudience: [...prev.targetAudience, audience]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  targetAudience: prev.targetAudience.filter(a => a !== audience)
                                }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{audience}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleNext({})}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Partnership Goals</h2>
                  <p className="text-gray-600">What do you hope to achieve through this partnership?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnershipGoals">Partnership Goals & Objectives *</Label>
                  <Textarea
                    id="partnershipGoals"
                    value={formData.partnershipGoals}
                    onChange={(e) => setFormData(prev => ({ ...prev, partnershipGoals: e.target.value }))}
                    rows={6}
                    placeholder="Describe your goals for partnering with us, how you plan to integrate our services, and what outcomes you expect..."
                  />
                </div>

                <div className="flex justify-between">
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleNext({})}
                    disabled={!formData.partnershipGoals.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms & Conditions</h2>
                  <p className="text-gray-600">Review and accept our partnership agreement</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Partnership Agreement</h3>
                  <div className="text-sm text-gray-700 space-y-3">
                    <p>
                      By partnering with us, you agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Maintain confidentiality of patient information</li>
                      <li>Comply with HIPAA regulations and data protection laws</li>
                      <li>Provide accurate information about your organization</li>
                      <li>Use our platform in accordance with our terms of service</li>
                      <li>Maintain professional standards in all interactions</li>
                      <li>Report any security incidents or data breaches immediately</li>
                    </ul>
                    <p>
                      We reserve the right to review and approve all partnership applications. 
                      Approval is subject to our internal review process and compliance verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mt-1 mr-3"
                  />
                  <label className="text-sm text-gray-700">
                    I agree to the partnership terms and conditions and confirm that all information provided is accurate.
                  </label>
                </div>

                <div className="flex justify-between">
                  <Button 
                    onClick={handleBack}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleSubmit({})}
                    disabled={!formData.termsAccepted}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Success Modal */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  Application Submitted!
                </DialogTitle>
                <DialogDescription>
                  Thank you for your interest in partnering with us.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-700">
                    We've received your partnership application and sent a magic link to <strong>{enrollmentEmail}</strong>. 
                    You can access your dashboard now, but some features will be limited until approval.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">📧 Check Your Email</h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    A magic link has been sent to your email. Click it to access your partner dashboard.
                  </p>
                  <p className="text-sm text-yellow-800">
                    <strong>Approval Timeline:</strong> 24-48 hours
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check your email for the magic link</li>
                    <li>• Access your dashboard (limited features)</li>
                    <li>• Application review (24-48 hours)</li>
                    <li>• Full access after approval</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1"
                    variant="outline"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowSuccessModal(false)
                      // Open email client or show instructions
                      window.open(`mailto:${enrollmentEmail}`, '_blank')
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Check Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
