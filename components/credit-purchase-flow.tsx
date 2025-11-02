'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, CreditCard, Loader2, AlertCircle, Info, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface CreditPackage {
  package_type: string
  name: string
  description: string
  sessions_included: number
  price_kobo: number
  session_duration_minutes: number
  savings_kobo: number
  is_active: boolean
}

interface CreditPurchaseFlowProps {
  userId: string
  onPurchaseComplete?: () => void
}

export default function CreditPurchaseFlow({ userId, onPurchaseComplete }: CreditPurchaseFlowProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      const data = await response.json()

      if (response.ok && data.success) {
        // Filter out free signup package
        const paidPackages = data.data.packages.filter(
          (pkg: CreditPackage) => pkg.package_type !== 'signup_free'
        )
        setPackages(paidPackages)
      } else {
        setError('Failed to load packages')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg)
    setShowConfirmDialog(true)
  }

  const handlePurchase = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    if (!selectedPackage) {
      console.error('❌ No package selected')
      toast({
        title: 'Error',
        description: 'Please select a package first',
        variant: 'destructive'
      })
      return
    }

    console.log('🚀 handlePurchase called for package:', selectedPackage.package_type)
    setProcessing(true)
    setError(null)

    try {
      console.log('🚀 Initiating payment for package:', selectedPackage.package_type)
      
      // Initiate payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          package_type: selectedPackage.package_type
        })
      })

      console.log('📡 Fetch response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      const data = await response.json()
      console.log('📦 Payment API response data:', data)

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Payment initiation failed (${response.status})`
        console.error('❌ Payment initiation failed:', errorMsg, data)
        throw new Error(errorMsg)
      }

      // Check response structure
      if (!data.success) {
        console.error('❌ API returned success: false', data)
        throw new Error(data.error || 'Payment initiation failed')
      }

      // Redirect to Paystack payment page
      const paymentUrl = data.data?.payment_url || data.data?.authorization_url || data.payment_url
      if (paymentUrl) {
        console.log('✅ Payment URL received, redirecting to:', paymentUrl)
        // Small delay to ensure state updates
        setTimeout(() => {
          window.location.href = paymentUrl
        }, 100)
      } else {
        console.error('❌ Payment URL missing from response:', data)
        throw new Error('Payment URL not received from server. Please try again.')
      }

    } catch (err) {
      console.error('❌ Payment error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed'
      setError(errorMessage)
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive'
      })
      setProcessing(false)
      // Keep dialog open so user can retry
    }
  }

  const formatPrice = (kobo: number) => {
    const naira = kobo / 100
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(naira)
  }

  const calculatePricePerSession = (pkg: CreditPackage) => {
    return pkg.price_kobo / pkg.sessions_included / 100
  }

  const getBestValuePackage = () => {
    if (packages.length === 0) return null
    return packages.reduce((best, current) => {
      const currentPricePerSession = calculatePricePerSession(current)
      const bestPricePerSession = calculatePricePerSession(best)
      return currentPricePerSession < bestPricePerSession ? current : best
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && packages.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const bestValue = getBestValuePackage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Purchase Therapy Credits</h2>
        <p className="text-muted-foreground">
          Choose a package that fits your healing journey
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All paid sessions are <strong>35 minutes</strong> long. Credits never expire and can be used anytime.
        </AlertDescription>
      </Alert>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isBestValue = bestValue?.package_type === pkg.package_type
          const pricePerSession = calculatePricePerSession(pkg)

          return (
            <Card 
              key={pkg.package_type}
              className={`relative transition-all ${
                isBestValue 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'hover:border-primary/50'
              }`}
            >
              {isBestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.name}</span>
                  {pkg.savings_kobo > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Save {formatPrice(pkg.savings_kobo)}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center space-y-1">
                  <div className="text-4xl font-bold">
                    {formatPrice(pkg.price_kobo)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(pricePerSession * 100)}/session
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>{pkg.sessions_included}</strong> therapy sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>{pkg.session_duration_minutes} minutes</strong> per session
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Credits never expire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Book with any therapist</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <Button
                  className="w-full"
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={processing}
                  variant={isBestValue ? 'default' : 'outline'}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Purchase Package
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment Methods */}
      <div className="text-center text-sm text-muted-foreground">
        <p className="mb-2">Secure payment powered by Paystack</p>
        <p>We accept: Card, Bank Transfer, USSD, Mobile Money</p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase the following package
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Package:</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sessions:</span>
                    <span>{selectedPackage.sessions_included} × {selectedPackage.session_duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(selectedPackage.price_kobo)}</span>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔘 Proceed to Payment button clicked')
                    handlePurchase(e)
                  }}
                  disabled={processing || !selectedPackage}
                  type="button"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

