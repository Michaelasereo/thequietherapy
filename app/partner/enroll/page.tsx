"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
    servicesOffered: [],
    targetAudience: [],
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
    
    setEnrollmentEmail(formData.email)
    setShowSuccessModal(true)
  }

  const steps = [
    { id: 1, title: "Organization Details", icon: Building },
    { id: 2, title: "Business Information", icon: Globe },
    { id: 3, title: "Partnership Goals", icon: Award },
    { id: 4, title: "Terms & Conditions", icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Partner Portal</span>
            </div>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Partner with Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our network of trusted partners and help us provide accessible mental health services to communities worldwide.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <BookingProgress steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Details</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your organization name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      value={formData.organizationType}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@organization.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourorganization.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees
                    </label>
                    <select
                      value={formData.numberOfEmployees}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfEmployees: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partnership Goals & Objectives *
                  </label>
                  <textarea
                    value={formData.partnershipGoals}
                    onChange={(e) => setFormData(prev => ({ ...prev, partnershipGoals: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  We've received your partnership application. Our team will review it and get back to you at <strong>{enrollmentEmail}</strong> within 2-3 business days.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Review of your application</li>
                  <li>• Background verification</li>
                  <li>• Partnership agreement discussion</li>
                  <li>• Onboarding process</li>
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
                <Link href="/partner/sign-up" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
