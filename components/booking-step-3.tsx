"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface BookingStep3Props {
  onBack: () => void
  onCheckout: () => void
  selectedTherapistId: string
}

export default function BookingStep3({ onBack, onCheckout, selectedTherapistId }: BookingStep3Props) {
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "paystack">("credits")
  const [userCredits, setUserCredits] = useState(15) // Mock user credits

  const sessionCost = 5 // Credits per session

  const handleCheckout = () => {
    if (paymentMethod === "credits" && userCredits < sessionCost) {
      toast({
        title: "Insufficient Credits",
        description: "You need more credits to book this session.",
        variant: "destructive",
      })
      return
    }

    // Simulate payment process
    if (paymentMethod === "credits") {
      setUserCredits(prev => prev - sessionCost)
    }

    toast({
      title: "Payment Successful!",
      description: `Session booked using ${paymentMethod === "credits" ? "credits" : "Paystack"}.`,
    })
    onCheckout()
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">Confirm & Checkout</h3>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(value: "credits" | "paystack") => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credits" id="credits" />
                <Label htmlFor="credits" className="flex items-center justify-between w-full">
                  <span>Pay with Credits</span>
                  <span className="text-sm text-muted-foreground">Balance: {userCredits} credits</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paystack" id="paystack" />
                <Label htmlFor="paystack">Pay with Paystack</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Session Cost:</span>
              <span>{paymentMethod === "credits" ? `${sessionCost} credits` : "₦2,500"}</span>
            </div>
            {paymentMethod === "credits" && (
              <div className="flex justify-between">
                <span>Credits Remaining:</span>
                <span>{userCredits - sessionCost} credits</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleCheckout} className="w-full md:w-auto">
          Confirm & {paymentMethod === "credits" ? "Book" : "Pay"}
        </Button>
      </div>
    </div>
  )
}
