"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatAmountForDisplay } from "@/lib/paystack"

interface PaystackPaymentProps {
  amount: number
  email: string
  reference: string
  metadata?: {
    [key: string]: any
  }
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  buttonText?: string
  className?: string
}



export default function PaystackPayment({
  amount,
  email,
  reference,
  metadata = {},
  onSuccess,
  onError,
  buttonText = "Pay Now",
  className = ""
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // No need to load script for authorization URL approach

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Initialize payment on backend
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          reference,
          metadata,
          callback_url: `${window.location.origin}/api/paystack/verify`
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      // Redirect to Paystack checkout page
      if (result.data.authorization_url) {
        window.location.href = result.data.authorization_url
      } else {
        throw new Error('No authorization URL received from Paystack')
      }

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      })
      onError?.(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? "Processing..." : `${buttonText} - ${formatAmountForDisplay(amount)}`}
    </Button>
  )
}
