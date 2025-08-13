'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Minus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isCustomAmount, setIsCustomAmount] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const creditPackages = [
    {
      id: "basic",
      name: "Basic Package",
      credits: 5,
      price: 50,
      savings: 0,
      popular: false
    },
    {
      id: "standard",
      name: "Standard Package",
      credits: 12,
      price: 100,
      savings: 20,
      popular: true
    },
    {
      id: "premium",
      name: "Premium Package",
      credits: 25,
      price: 180,
      savings: 50,
      popular: false
    }
  ]

  // Fetch user credits on component mount
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from('global_users')
            .select('credits')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching user credits:', error)
            setUserCredits(0)
          } else {
            setUserCredits(data?.credits || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching user credits:', error)
        setUserCredits(0)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCredits()
  }, [])

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
      credits = Math.floor(amount / 10) // 1 credit = $10
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

    // Here you would integrate with your payment system
    toast({
      title: "Processing Payment",
      description: `Processing payment for ${credits} credits ($${amount.toFixed(2)})`,
    })

    // Simulate payment processing and update credits
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error } = await supabase
            .from('global_users')
            .update({ credits: userCredits + credits })
            .eq('id', user.id)

          if (error) {
            console.error('Error updating credits:', error)
            toast({
              title: "Error",
              description: "Payment successful but failed to update credits. Please contact support.",
              variant: "destructive",
            })
          } else {
            setUserCredits(prev => prev + credits)
            toast({
              title: "Payment Successful! 🎉",
              description: `You've purchased ${credits} credits for $${amount.toFixed(2)}`,
            })
          }
        }
      } catch (error) {
        console.error('Error updating credits:', error)
        toast({
          title: "Error",
          description: "Payment successful but failed to update credits. Please contact support.",
          variant: "destructive",
        })
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Buy Credits</h2>
          <p className="text-sm text-muted-foreground">Purchase credits for therapy sessions</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading credits...</span>
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
          <div className="text-3xl font-bold text-blue-600">{userCredits}</div>
          <p className="text-sm text-muted-foreground mt-1">Available for booking sessions</p>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {creditPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`shadow-sm cursor-pointer transition-all ${
              selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
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
              <div className="text-2xl font-bold text-blue-600">{pkg.credits} Credits</div>
              <div className="text-lg font-semibold">${pkg.price}</div>
              {pkg.savings > 0 && (
                <div className="text-sm text-green-600">Save ${pkg.savings}</div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                ${(pkg.price / pkg.credits).toFixed(2)} per credit
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
              <Label htmlFor="custom-amount">Amount (USD)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount (minimum $10)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="10"
                  step="1"
                  className="flex-1"
                />
              </div>
            </div>
            {customAmount && parseFloat(customAmount) >= 10 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  You'll receive: <span className="font-semibold text-blue-600">
                    {Math.floor(parseFloat(customAmount) / 10)} credits
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Rate: $10 per credit
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
          disabled={!selectedPackage && (!customAmount || parseFloat(customAmount) < 10)}
          className="px-8 py-3"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Purchase Credits
        </Button>
      </div>

      {/* Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium">1 Credit = 1 Session</p>
              <p className="text-sm text-muted-foreground">Each therapy session costs 1 credit</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium">Credits Never Expire</p>
              <p className="text-sm text-muted-foreground">Use your credits whenever you want</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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
