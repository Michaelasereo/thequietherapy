"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DollarSign, 
  CheckCircle, 
  Heart,
  Loader2
} from "lucide-react"
import { calculateDonationImpact, formatCurrency } from "@/lib/donation-stats"

interface DonationFormProps {
  selectedAmount: number | null
  onAmountSelect: (amount: number | null) => void
  customAmount: string
  onCustomAmountChange: (amount: string) => void
  onDonate: (amount: number, donorInfo: { name: string; email: string; anonymous: boolean }) => Promise<void>
  isProcessing: boolean
}

const donationAmounts = [
  { amount: 5000, label: "₦5,000", description: "Support one therapy session" },
  { amount: 10000, label: "₦10,000", description: "Support two therapy sessions" },
  { amount: 25000, label: "₦25,000", description: "Support a week of therapy" },
  { amount: 50000, label: "₦50,000", description: "Support a month of therapy" },
  { amount: 100000, label: "₦100,000", description: "Support multiple students" },
  { amount: 0, label: "Custom", description: "Enter your own amount" }
]

export default function DonationForm({
  selectedAmount,
  onAmountSelect,
  customAmount,
  onCustomAmountChange,
  onDonate,
  isProcessing
}: DonationFormProps) {
  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; amount?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; amount?: string } = {}
    
    if (!anonymous && !donorName.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!donorEmail.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    const amount = selectedAmount === 0 ? parseInt(customAmount) : selectedAmount
    if (!amount || amount <= 0) {
      newErrors.amount = "Please select or enter a valid donation amount"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDonate = async () => {
    if (!validateForm()) return
    
    const amount = selectedAmount === 0 ? parseInt(customAmount) : selectedAmount
    if (!amount) return
    
    await onDonate(amount, {
      name: anonymous ? "Anonymous Donor" : donorName,
      email: donorEmail,
      anonymous
    })
  }

  const currentAmount = selectedAmount === 0 ? parseInt(customAmount) : selectedAmount
  const impactMessage = currentAmount ? calculateDonationImpact(currentAmount) : null

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl">Make a Donation</CardTitle>
        <CardDescription>Choose an amount or enter a custom donation to support our mission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Select Amount</Label>
          <div className="grid grid-cols-2 gap-3">
            {donationAmounts.map((option, index) => (
              <Button
                key={index}
                variant={selectedAmount === option.amount ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center ${
                  selectedAmount === option.amount 
                    ? "bg-[#A66B24] hover:bg-[#8B5A1F]" 
                    : ""
                }`}
                onClick={() => {
                  onAmountSelect(option.amount)
                  if (option.amount !== 0) {
                    onCustomAmountChange("")
                  }
                }}
                disabled={isProcessing}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        {selectedAmount === 0 && (
          <div className="space-y-2">
            <Label className="text-base font-medium">Custom Amount</Label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">₦</span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => onCustomAmountChange(e.target.value)}
                className="flex-1"
                disabled={isProcessing}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
        )}

        {/* Donor Information */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Donor Information</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(checked as boolean)}
              disabled={isProcessing}
            />
            <Label htmlFor="anonymous" className="text-sm">
              Make this donation anonymous
            </Label>
          </div>

          {!anonymous && (
            <div className="space-y-2">
              <Label htmlFor="donorName">Full Name</Label>
              <Input
                id="donorName"
                type="text"
                placeholder="Enter your full name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                disabled={isProcessing}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="donorEmail">Email Address</Label>
            <Input
              id="donorEmail"
              type="email"
              placeholder="Enter your email address"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              disabled={isProcessing}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Impact Preview */}
        {impactMessage && currentAmount && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">
                {formatCurrency(currentAmount)} will {impactMessage.toLowerCase()}
              </p>
            </div>
          </div>
        )}

        {/* Donate Button */}
        <Button
          className="w-full bg-[#A66B24] hover:bg-[#8B5A1F] text-white py-3 text-lg"
          onClick={handleDonate}
          disabled={isProcessing || (selectedAmount === 0 && (!customAmount || parseInt(customAmount) <= 0))}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="mr-2 h-5 w-5" />
              Donate {currentAmount ? formatCurrency(currentAmount) : ""}
            </>
          )}
        </Button>

        {/* Security Note */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Secure Payment:</strong> Your donation is processed securely through Paystack. 
            We never store your payment information.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
