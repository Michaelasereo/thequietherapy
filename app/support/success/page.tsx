"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Heart, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import LandingNavbar from "@/components/landing-navbar"

function DonationSuccessContent() {
  const searchParams = useSearchParams()
  const [donationData, setDonationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get donation data from URL parameters
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    const amount = searchParams.get('amount')
    const status = searchParams.get('status')

    console.log('🔍 Success page URL params:', { reference, amount, status })

    if (reference) {
      // Try to fetch donation data from database
      fetch(`/api/donations/verify?reference=${reference}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.donation) {
            setDonationData({
              reference: data.donation.paystack_reference,
              amount: data.donation.amount,
              status: data.donation.status,
              donor_name: data.donation.donor_name
            })
          } else {
            // Fallback to URL parameters if database lookup fails
            setDonationData({
              reference,
              amount: amount ? parseFloat(amount) : 100,
              status: status || 'success'
            })
          }
        })
        .catch(error => {
          console.error('Error fetching donation data:', error)
          // Fallback to URL parameters
          setDonationData({
            reference,
            amount: amount ? parseFloat(amount) : 100,
            status: status || 'success'
          })
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A66B24] mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your donation...</p>
        </div>
      </div>
    )
  }

  if (!donationData) {
    return (
      <div className="min-h-screen bg-white">
        <LandingNavbar />
        <div className="container px-4 md:px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl text-red-600">Donation Not Found</CardTitle>
                <CardDescription>
                  We couldn't find your donation information. Please contact support if you need assistance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/support">
                  <Button className="bg-[#A66B24] hover:bg-[#8B5A1F]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Support Page
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      <div className="container px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <Card className="p-8 text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-3xl text-green-600 mb-2">
                Thank You for Your Donation!
              </CardTitle>
              <CardDescription className="text-lg">
                Your generous contribution helps us provide free therapy to underserved medical students and doctors.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Donation Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-semibold text-green-900">
                      {formatCurrency(donationData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Reference:</span>
                    <span className="font-mono text-green-900 text-xs">
                      {donationData.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className="text-green-600 font-semibold">Successful</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Your Impact</h3>
                <p className="text-sm text-blue-800">
                  Your donation of {formatCurrency(donationData.amount)} will help fund therapy sessions for medical students and doctors who cannot afford mental health support. Every Naira makes a difference in someone's life.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/support">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Support Page
                  </Button>
                </Link>
                <Button 
                  className="w-full sm:w-auto bg-[#A66B24] hover:bg-[#8B5A1F]"
                  onClick={() => {
                    const shareText = `I just donated to support mental health for underserved medical students and doctors in Nigeria! Join me in supporting this important cause.`
                    const shareUrl = `${window.location.origin}/support`
                    
                    if (navigator.share) {
                      navigator.share({
                        title: 'Support Mental Health in Nigeria',
                        text: shareText,
                        url: shareUrl
                      })
                    } else {
                      // Fallback to copying to clipboard
                      navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
                      alert('Share link copied to clipboard!')
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="text-xl">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#A66B24] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Receipt Sent</h4>
                  <p className="text-sm text-gray-600">You'll receive a receipt via email for your donation.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#A66B24] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Funds Allocated</h4>
                  <p className="text-sm text-gray-600">Your donation will be used to provide free therapy sessions to underserved communities.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#A66B24] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Impact Updates</h4>
                  <p className="text-sm text-gray-600">We'll keep you updated on how your donation is making a difference.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A66B24] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  )
}
