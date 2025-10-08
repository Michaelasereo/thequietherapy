"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Clock, AlertCircle, CreditCard, RefreshCw } from "lucide-react"
import { formatAmountForDisplay } from "@/lib/paystack-client"

interface PaymentStatusProps {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  className?: string
}

export default function PaymentStatus({ onSuccess, onError, className = "" }: PaymentStatusProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [status, setStatus] = useState<'success' | 'failed' | 'pending' | 'error' | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const reference = searchParams.get('reference')
    const error = searchParams.get('error')
    const type = searchParams.get('type')
    const credits = searchParams.get('credits')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus) {
      setStatus(paymentStatus as any)
      
      if (paymentStatus === 'success') {
        const data = {
          reference,
          type,
          credits: credits ? parseInt(credits) : null,
          session_id: sessionId
        }
        setPaymentData(data)
        
        // Show success toast
        if (type === 'credits' && credits) {
          toast({
            title: "Payment Successful!",
            description: `Successfully purchased ${credits} credits.`,
          })
          onSuccess?.(data)
        } else if (type === 'session' && sessionId) {
          toast({
            title: "Session Booked!",
            description: "Your therapy session has been successfully booked.",
          })
          onSuccess?.(data)
        } else {
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          })
          onSuccess?.(data)
        }
      } else if (paymentStatus === 'failed') {
        const errorMessage = error || 'Payment failed'
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        })
        onError?.(errorMessage)
      } else if (paymentStatus === 'error') {
        const errorMessage = error || 'An error occurred during payment'
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        })
        onError?.(errorMessage)
      }
    }
  }, [searchParams, toast, onSuccess, onError])

  const handleVerifyPayment = async () => {
    if (!paymentData?.reference) return

    try {
      setVerifying(true)
      
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: paymentData.reference
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        toast({
          title: "Payment Verified!",
          description: "Your payment has been confirmed.",
        })
      } else {
        setStatus('failed')
        toast({
          title: "Verification Failed",
          description: result.error || 'Payment verification failed',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleRetry = () => {
    // Clear URL parameters and redirect to payment page
    router.push('/dashboard/credits')
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  if (!status) {
    return null
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            {status === 'failed' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
            {status === 'pending' && (
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-xl">
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'pending' && 'Payment Pending'}
            {status === 'error' && 'Payment Error'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                {paymentData?.type === 'credits' && paymentData?.credits && (
                  <>Successfully purchased <strong>{paymentData.credits} credits</strong>!</>
                )}
                {paymentData?.type === 'session' && (
                  <>Your therapy session has been successfully booked!</>
                )}
                {!paymentData?.type && (
                  <>Your payment has been processed successfully!</>
                )}
              </p>
              
              {paymentData?.reference && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm">{paymentData.reference}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleContinue} className="flex-1">
                  Continue to Dashboard
                </Button>
                {paymentData?.type === 'credits' && (
                  <Button variant="outline" onClick={() => router.push('/dashboard/credits')}>
                    Buy More Credits
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Your payment was not successful. This could be due to insufficient funds, 
                card restrictions, or other payment issues.
              </p>
              
              {paymentData?.reference && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm">{paymentData.reference}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleContinue}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Your payment is being processed. This usually takes a few minutes.
              </p>
              
              {paymentData?.reference && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm">{paymentData.reference}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyPayment} 
                  disabled={verifying}
                  className="flex-1"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleContinue}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                An unexpected error occurred during payment processing. 
                Please contact support if this persists.
              </p>
              
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleContinue}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
          
          {/* Support Information */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@thequietherapy.com" className="text-blue-600 hover:underline">
                support@thequietherapy.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
