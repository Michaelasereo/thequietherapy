"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { mockUser } from "@/lib/data"
import { CreditCard } from "lucide-react"

export default function UserCreditsPage() {
  const { toast } = useToast()
  const [customCredits, setCustomCredits] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState<number>(50000)

  // Calculate price based on credits (₦5,000 per credit)
  const creditPrice = 5000
  const calculatedAmount = customCredits * creditPrice

  const handlePurchase = () => {
    if (customCredits < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number of credits.",
        variant: "destructive",
      })
      return
    }

    // Simulate Paystack payment
    toast({
      title: "Redirecting to Paystack",
      description: `Processing payment for ${customCredits} credits (₦${calculatedAmount.toLocaleString()})`,
    })

    // In real implementation, redirect to Paystack
    setTimeout(() => {
      toast({
        title: "Payment Successful!",
        description: `${customCredits} credits added to your account.`,
      })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Buy Credits</h2>

      {/* Current Balance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{mockUser.credits} credits</div>
          <p className="text-sm text-muted-foreground mt-1">
            {mockUser.isPartnerUser ? mockUser.partnerName : "Individual"} • {mockUser.package} Package
          </p>
        </CardContent>
      </Card>

      {/* Buy Custom Credits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Number of Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                value={customCredits}
                onChange={(e) => setCustomCredits(Number(e.target.value))}
                placeholder="Enter number of credits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                value={calculatedAmount}
                onChange={(e) => {
                  const amount = Number(e.target.value)
                  setCustomAmount(amount)
                  setCustomCredits(Math.round(amount / creditPrice))
                }}
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Credits:</span>
                <span>{customCredits}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per credit:</span>
                <span>₦{creditPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₦{calculatedAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Button onClick={handlePurchase} className="w-full" disabled={customCredits < 1}>
            Pay with Paystack
          </Button>
        </CardContent>
      </Card>

      {/* Credit Usage Info */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Each therapy session costs 5 credits</p>
          <p>• Credits are deducted when you book a session</p>
          <p>• You can buy any number of credits you need</p>
          <p>• Partner users receive credits from their organization</p>
        </CardContent>
      </Card>
    </div>
  )
}
