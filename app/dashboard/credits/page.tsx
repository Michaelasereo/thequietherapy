'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Minus, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CreditsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isCustomAmount, setIsCustomAmount] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const creditPackages = [
    {
      id: "basic",
      name: "Basic Package",
      credits: 1,
      price: 5000,
      savings: 0,
      popular: false
    },
    {
      id: "standard",
      name: "Standard Package",
      credits: 3,
      price: 14000,
      savings: 1000,
      popular: true
    },
    {
      id: "premium",
      name: "Premium Package",
      credits: 5,
      price: 22500,
      savings: 2500,
      popular: false
    },
    {
      id: "family",
      name: "Family Package",
      credits: 10,
      price: 42500,
      savings: 7500,
      popular: false
    }
  ]

  // Fetch user credits on component mount and after payment
  const fetchUserCredits = async () => {
    try {
      console.log('🔍 Credits page: Fetching user credits...')
      const response = await fetch('/api/credits/user')
      console.log('🔍 Credits page: Response status:', response.status)
      
      if (!response.ok) {
        console.warn('Credits API not available, assuming no credits')
        setUserCredits(0)
      } else {
        const creditsData = await response.json()
        console.log('🔍 Credits page: Credits data received:', creditsData)
        
        if (creditsData.success) {
          setUserCredits(creditsData.data.total_credits || 0)
          return creditsData.data.total_credits || 0
        } else {
          console.warn('Failed to fetch credits, assuming no credits:', creditsData)
          setUserCredits(0)
          return 0
        }
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
      setUserCredits(0)
      return 0
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserCredits()
  }, [])

  // Handle payment success callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const credits = searchParams.get('credits')
    const reference = searchParams.get('reference')
    
    if (paymentStatus === 'success') {
      // Refresh credits after successful payment
      fetchUserCredits().then((newCredits) => {
        if (credits) {
          toast({
            title: "Payment Successful! 🎉",
            description: `You've successfully purchased ${credits} credits. Your balance has been updated.`,
          })
        } else {
          toast({
            title: "Payment Successful! 🎉",
            description: "Your credits have been added to your account.",
          })
        }
        
        // Clean up URL params
        router.replace('/dashboard/credits', { scroll: false })
      })
    } else if (paymentStatus === 'failed') {
      const error = searchParams.get('error')
      toast({
        title: "Payment Failed",
        description: error || "Payment was not completed. Please try again.",
        variant: "destructive",
      })
      // Clean up URL params
      router.replace('/dashboard/credits', { scroll: false })
    }
  }, [searchParams, router])

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId)
    setIsCustomAmount(false)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustomAmount(true)
    setSelectedPackage("")
  }

  const handlePurchase = async () => {
    let amount = 0
    let credits = 0

    if (isCustomAmount && customAmount) {
      amount = parseFloat(customAmount)
      credits = Math.floor(amount / 5000) // 1 credit = ₦5000
    } else if (selectedPackage) {
      const pkg = creditPackages.find(p => p.id === selectedPackage)
      if (pkg) {
        amount = pkg.price
        credits = pkg.credits
      }
    }

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please select a package or enter a custom amount.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Quick verification - user is already authenticated to be on dashboard
      // Just ensure we have user email for payment
      if (!user?.email) {
        toast({
          title: "Authentication Error",
          description: "Unable to get your email. Please try refreshing the page.",
          variant: "destructive",
        })
        setProcessing(false)
        return
      }

      toast({
        title: "Initializing Payment",
        description: `Redirecting to Paystack for ${credits} credits (₦${amount.toLocaleString()})`,
      })

      // Generate unique payment reference
      const reference = `credits_${selectedPackage || 'custom'}_${user.id.slice(0, 8)}_${Date.now()}`

      // Call Paystack API to initialize payment
      // NOTE: Send amount in Naira - backend will convert to kobo
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount, // Send in Naira - backend converts to kobo
          email: user.email,
          reference: reference,
          callback_url: `${window.location.origin}/dashboard/credits?payment=success`,
          metadata: {
            type: 'credits',
            credits: credits,
            package_id: selectedPackage || 'custom',
            amount_naira: amount,
          },
          user_id: user.id,
          user_type: 'individual'
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      // Validate authorization URL before redirecting
      if (!result.data?.authorization_url) {
        console.error('❌ Missing authorization_url in response:', result)
        throw new Error('Payment gateway did not return a valid payment URL. Please try again.')
      }

      // Redirect to Paystack checkout page
      window.location.href = result.data.authorization_url

    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Show loading while checking auth or loading credits
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Buy Credits</h2>
          <p className="text-sm text-muted-foreground">Purchase credits for therapy sessions</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">
            {authLoading ? 'Checking authentication...' : 'Loading credits...'}
          </span>
        </div>
      </div>
    )
  }

  // If not authenticated, show message
  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Buy Credits</h2>
          <p className="text-sm text-muted-foreground">Purchase credits for therapy sessions</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-lg font-semibold">Authentication Required</p>
          <p className="text-muted-foreground text-center max-w-md">
            Please log in to purchase credits. Check your email for the magic link or click below to login.
          </p>
          <Button onClick={() => router.push('/login?redirect=/dashboard/credits')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Buy Credits</h2>
        <p className="text-sm text-muted-foreground">Purchase credits for therapy sessions</p>
      </div>

      {/* Current Credits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-black">{userCredits}</div>
          <p className="text-sm text-muted-foreground mt-1">Available for booking sessions</p>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {creditPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`shadow-sm cursor-pointer transition-all ${
              selectedPackage === pkg.id ? 'ring-2 ring-black bg-gray-50' : 'hover:shadow-md'
            }`}
            onClick={() => handlePackageSelect(pkg.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.popular && (
                  <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{pkg.credits} Credits</div>
              <div className="text-lg font-semibold">₦{pkg.price}</div>
              {pkg.savings > 0 && (
                <div className="text-sm text-green-600">Save ₦{pkg.savings}</div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                ₦{(pkg.price / pkg.credits).toFixed(2)} per credit
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Amount */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-amount">Amount (₦)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount (minimum ₦5,000)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="5000"
                  step="1000"
                  className="flex-1"
                />
              </div>
            </div>
            {customAmount && parseFloat(customAmount) >= 5000 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  You'll receive: <span className="font-semibold text-black">
                    {Math.floor(parseFloat(customAmount) / 5000)} credits
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Rate: ₦5,000 per credit
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handlePurchase}
          disabled={processing || (!selectedPackage && (!customAmount || parseFloat(customAmount) < 5000))}
          className="px-8 py-3"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Purchase Credits
            </>
          )}
        </Button>
      </div>

      {/* Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium">1 Credit = 1 Session</p>
              <p className="text-sm text-muted-foreground">Each therapy session costs 1 credit</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium">Credits Never Expire</p>
              <p className="text-sm text-muted-foreground">Use your credits whenever you want</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium">Secure Payment</p>
              <p className="text-sm text-muted-foreground">All payments are processed securely</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
