"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, CheckCircle, AlertCircle, Loader2, Star } from "lucide-react"
import { formatAmountForDisplay, generatePaymentReference } from "@/lib/paystack-enhanced"
import { useAuth } from "@/context/auth-context"

interface CreditPackage {
  id: string
  name: string
  description: string
  credits: number
  price: number
  popular?: boolean
}

interface CreditPurchaseProps {
  onSuccess?: (credits: number) => void
  onError?: (error: string) => void
  className?: string
}

export default function CreditPurchase({ onSuccess, onError, className = "" }: CreditPurchaseProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load credit packages
  useEffect(() => {
    loadCreditPackages()
  }, [])

  const loadCreditPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credits/packages')
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
        
        // Set default package (popular or first)
        const defaultPackage = data.packages?.find((pkg: CreditPackage) => pkg.popular) || data.packages?.[0]
        if (defaultPackage) {
          setSelectedPackage(defaultPackage)
        }
      } else {
        throw new Error('Failed to load credit packages')
      }
    } catch (error) {
      console.error('Error loading credit packages:', error)
      toast({
        title: "Error",
        description: "Failed to load credit packages. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg)
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user?.email) {
      toast({
        title: "Error",
        description: "Please select a package and ensure you're logged in.",
        variant: "destructive",
      })
      return
    }

    try {
      setInitializing(true)

      // Generate unique payment reference
      const reference = generatePaymentReference('CREDITS')

      // Initialize payment
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPackage.price,
          email: user.email,
          reference: reference,
          metadata: {
            type: 'credits',
            credits: selectedPackage.credits,
            package_id: selectedPackage.id,
            user_id: user.id,
            user_type: user.user_type || 'user'
          }
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      // Redirect to Paystack checkout
      if (result.data.authorization_url) {
        window.location.href = result.data.authorization_url
      } else {
        throw new Error('No authorization URL received from Paystack')
      }

    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      onError?.(errorMessage)
    } finally {
      setInitializing(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading credit packages...</span>
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No credit packages available</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Purchase Credits</h2>
        <p className="text-gray-600">Choose a credit package to continue with therapy sessions</p>
      </div>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPackage?.id === pkg.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handlePackageSelect(pkg)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.popular && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {pkg.credits === -1 ? '∞' : pkg.credits}
                </div>
                <div className="text-sm text-gray-500">credits</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatAmountForDisplay(pkg.price)}
                </div>
                {pkg.credits > 0 && (
                  <div className="text-sm text-gray-500">
                    {formatAmountForDisplay(pkg.price / pkg.credits)} per credit
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 text-center">
                {pkg.description}
              </p>

              {selectedPackage?.id === pkg.id && (
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Purchase Button */}
      {selectedPackage && (
        <div className="text-center space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Selected Package</h3>
            <div className="flex items-center justify-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Credits:</span>
                <div className="font-bold text-lg">
                  {selectedPackage.credits === -1 ? 'Unlimited' : selectedPackage.credits}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Price:</span>
                <div className="font-bold text-lg text-green-600">
                  {formatAmountForDisplay(selectedPackage.price)}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={initializing || !user?.email}
            size="lg"
            className="w-full max-w-md"
          >
            {initializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase {selectedPackage.credits === -1 ? 'Unlimited' : selectedPackage.credits} Credits
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            You'll be redirected to Paystack to complete your payment securely
          </p>
        </div>
      )}

      {/* Features */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4 text-blue-900">What you get with credits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Access to licensed therapists</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Secure video sessions</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Session notes and progress tracking</span>
          </div>
        </div>
      </div>
    </div>
  )
}
