"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Heart, 
  Users, 
  GraduationCap, 
  Stethoscope, 
  CheckCircle,
  TrendingUp
} from "lucide-react"
import LandingNavbar from "@/components/landing-navbar"
import { RealTimeProgress } from "@/components/RealTimeProgress"
import DonationForm from "@/components/DonationForm"
import { formatCurrency } from "@/lib/donation-stats"

// Static impact statistics (these don't change frequently)

const futureGoals = [
  {
    icon: <Users className="h-6 w-6" />,
    number: "10,000+",
    label: "Students to Support",
    description: "Medical students who will receive free therapy"
  },
  {
    icon: <Stethoscope className="h-6 w-6" />,
    number: "500+",
    label: "Doctors to Help",
    description: "Healthcare professionals we aim to support"
  },
  {
    icon: <Heart className="h-6 w-6" />,
    number: "50,000+",
    label: "Sessions to Provide",
    description: "Free therapy sessions we plan to deliver"
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    number: "25+",
    label: "Universities",
    description: "Partner institutions across Nigeria"
  }
]

export default function SupportPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDonation = async (
    amount: number, 
    donorInfo: { name: string; email: string; anonymous: boolean }
  ) => {
    setIsProcessing(true)
    
    try {
      // Call the donation API
      const response = await fetch('/api/donations/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email: donorInfo.email,
          name: donorInfo.name,
          anonymous: donorInfo.anonymous
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate donation')
      }

      // Redirect to Paystack payment page
      window.location.href = result.payment_url

    } catch (error) {
      console.error("Payment error:", error)
      alert(`There was an error processing your donation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800 mb-6">
              <Heart className="h-4 w-4" />
              Seed Funding Campaign
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-black leading-tight mb-6">
              Support Mental Health
              <span className="block text-[#A66B24]">for Underserved Communities</span>
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Help us scale our therapy platform to provide free mental health support for medical students and doctors who cannot afford therapy services. Your donation directly funds therapy sessions for those who need it most.
            </p>
          </div>
        </div>
      </section>

      {/* Fundraising Progress */}
      <section className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-r from-[#A66B24] to-[#8B5A1F] text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl mb-4">Our Fundraising Goal</CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  Help us raise ₦120,000,000 to expand our therapist network and provide free therapy to underserved communities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeProgress className="text-white" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="w-full py-16 bg-gray-50" data-section="donation-form">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Make a Donation</h2>
              <p className="text-gray-600 text-lg">
                Choose an amount or enter a custom donation to support our mission
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DonationForm
                selectedAmount={selectedAmount}
                onAmountSelect={setSelectedAmount}
                customAmount={customAmount}
                onCustomAmountChange={setCustomAmount}
                onDonate={handleDonation}
                isProcessing={isProcessing}
              />

              {/* Impact Information */}
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-xl">Your Impact</CardTitle>
                  <CardDescription>See how your donation makes a difference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">₦5,000 funds one therapy session</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">₦25,000 funds a week of therapy</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">₦100,000 supports multiple students</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Why This Matters</h4>
                    <p className="text-sm text-blue-800">
                      Many medical students and doctors in Nigeria struggle with mental health but cannot afford therapy. 
                      Your donation directly funds free sessions for those who need it most, helping to break down 
                      barriers to mental healthcare access.
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Transparency</h4>
                    <p className="text-sm text-green-800">
                      We provide regular updates on how funds are used and the impact of your donations. 
                      Every Naira goes directly to supporting therapy sessions for underserved communities.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Future Goals */}
      <section className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Look to Achieve Soon</h2>
            <p className="text-gray-600 text-lg">
              With your support, we're building the foundation for accessible mental healthcare across Nigeria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {futureGoals.map((goal, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex justify-center text-[#A66B24]">
                    {goal.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{goal.number}</div>
                  <div className="font-semibold text-gray-900">{goal.label}</div>
                  <div className="text-sm text-gray-600">{goal.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-16 bg-gradient-to-r from-[#A66B24] to-[#8B5A1F]">
        <div className="container px-4 md:px-6">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Our Mission to Transform Mental Healthcare
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Every donation brings us closer to our goal of providing free mental health support 
              to underserved medical students and doctors across Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-[#A66B24] hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={() => {
                  document.querySelector('[data-section="donation-form"]')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Heart className="mr-2 h-5 w-5" />
                Make a Donation
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#A66B24] px-8 py-4 text-lg"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Share Campaign
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
