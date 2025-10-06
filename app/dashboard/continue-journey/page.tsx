"use client"

import { useState, useEffect } from "react"
import { PricingCard } from "@/components/ui/pricing-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, Sparkles, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface PackageDefinition {
  package_type: string
  name: string
  description: string
  sessions_included: number
  price_kobo: number
  session_duration_minutes: number
  savings_kobo: number
}

interface UserCredits {
  total_credits: number
  free_credits: number
  paid_credits: number
}

export default function ContinueJourneyPage() {
  const [packages, setPackages] = useState<PackageDefinition[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchPackagesAndCredits()
  }, [])

  const fetchPackagesAndCredits = async () => {
    try {
      // Fetch available packages
      const packagesResponse = await fetch('/api/packages', {
        credentials: 'include'
      })
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        // Filter out the signup_free package
        setPackages(packagesData.packages.filter((p: PackageDefinition) => p.package_type !== 'signup_free'))
      }

      // Fetch user's current credits
      const creditsResponse = await fetch('/api/user/credits', {
        credentials: 'include'
      })
      
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setUserCredits(creditsData.credits)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load pricing information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageType: string) => {
    setPurchasing(packageType)
    
    try {
      // Initiate payment process
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          package_type: packageType
        })
      })

      const data = await response.json()

      if (response.ok && data.payment_url) {
        // Redirect to Paystack
        window.location.href = data.payment_url
      } else {
        throw new Error(data.error || 'Payment initiation failed')
      }

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      })
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-red-500 mr-2" />
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            We're glad we could help.
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Your healing journey is just beginning.
          </p>
          
          <p className="text-lg text-gray-500">
            Book your next session to keep making progress toward better mental health.
          </p>

          {/* Current Credits Display */}
          {userCredits && userCredits.total_credits > 0 && (
            <Card className="mt-6 max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    Current Balance
                  </Badge>
                  <div className="text-2xl font-bold text-green-600">
                    {userCredits.total_credits} session{userCredits.total_credits !== 1 ? 's' : ''} remaining
                  </div>
                  {userCredits.free_credits > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Including {userCredits.free_credits} free session{userCredits.free_credits !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Session Duration Info */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">Session Duration Upgrade</span>
              </div>
              <div className="text-center text-sm">
                <p className="mb-2">
                  🆓 <strong>Free sessions:</strong> 25 minutes (perfect for getting started)
                </p>
                <p>
                  💎 <strong>Paid sessions:</strong> 35 minutes (deeper therapy work)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Choose Your Healing Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.package_type}
                packageType={pkg.package_type as any}
                title={pkg.name}
                description={pkg.description}
                price={pkg.price_kobo}
                sessions={pkg.sessions_included}
                sessionDuration={pkg.session_duration_minutes}
                saving={pkg.savings_kobo}
                recommended={pkg.package_type === 'bronze'}
                onPurchase={handlePurchase}
                loading={purchasing === pkg.package_type}
              />
            ))}
          </div>

          {/* Value Proposition */}
          <div className="max-w-3xl mx-auto text-center">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Why continue your therapy journey?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                  <div>
                    <strong>Consistent Progress</strong>
                    <p>Regular sessions build on each other for lasting change</p>
                  </div>
                  <div>
                    <strong>Deeper Healing</strong>
                    <p>35-minute sessions allow for more comprehensive work</p>
                  </div>
                  <div>
                    <strong>Better Value</strong>
                    <p>Bulk packages save you money while prioritizing your health</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="mb-2">🔒 Secure payments powered by Paystack</p>
            <p className="mb-2">👨‍⚕️ All therapists are licensed professionals</p>
            <p>💳 Credits never expire • 🎯 Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  )
}
