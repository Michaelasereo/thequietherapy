"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import PaystackPayment from "@/components/paystack-payment"
import { formatAmountForDisplay } from "@/lib/paystack-client"
import { CheckCircle, Clock, User } from "lucide-react"

interface TimeSlot {
  id: string
  date: string
  day_name: string
  start_time: string
  end_time: string
  session_duration: number
  session_title: string
  session_type: 'individual' | 'group'
  is_available: boolean
}

interface BookingStep4Props {
  onBack: () => void
  onCheckout: () => void
  selectedTherapistId: string
  selectedSlot: TimeSlot
  therapistInfo: any
  patientData: any
}

export default function BookingStep4({ 
  onBack, 
  onCheckout, 
  selectedTherapistId, 
  selectedSlot, 
  therapistInfo,
  patientData 
}: BookingStep4Props) {
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "paystack">("credits")
  const [userCredits, setUserCredits] = useState(15) // Mock user credits
  const [userEmail, setUserEmail] = useState("user@example.com") // Mock user email

  const sessionCost = 1 // Credits per session
  const sessionPrice = therapistInfo?.hourly_rate || 5000 // ₦5,000 per session

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleCheckout = () => {
    if (paymentMethod === "credits" && userCredits < sessionCost) {
      toast({
        title: "Insufficient Credits",
        description: "You need more credits to book this session.",
        variant: "destructive",
      })
      return
    }

    // Handle credit payment
    if (paymentMethod === "credits") {
      setUserCredits(prev => prev - sessionCost)
      toast({
        title: "Payment Successful!",
        description: "Session booked using credits.",
      })
      onCheckout()
    }
    // Paystack payment is handled by the PaystackPayment component
  }

  const handlePaystackSuccess = (data: any) => {
    toast({
      title: "Payment Successful!",
      description: "Session booked successfully via Paystack.",
    })
    onCheckout()
  }

  const handlePaystackError = (error: string) => {
    console.error('Paystack payment error:', error)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Complete Your Booking</h3>
        <p className="text-sm text-muted-foreground">
          Review your session details and choose your payment method
        </p>
      </div>

      {/* Session Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CheckCircle className="h-5 w-5" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Info */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{patientData.name}</h4>
              <p className="text-sm text-gray-600">{patientData.age} years, {patientData.gender}</p>
            </div>
          </div>

          {/* Therapist Info */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">
                {therapistInfo?.name?.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{therapistInfo?.name}</h4>
              <p className="text-sm text-gray-600">{therapistInfo?.specialization}</p>
            </div>
          </div>

          {/* Session Details */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedSlot.session_title}</h4>
              <p className="text-sm text-gray-600">
                {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
              </p>
              <p className="text-sm text-gray-600">
                {selectedSlot.session_duration} minutes • {selectedSlot.session_type === 'individual' ? 'Individual Session' : 'Group Session'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
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

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Session Cost:</span>
            <span>{paymentMethod === "credits" ? `${sessionCost} credits` : formatAmountForDisplay(sessionPrice)}</span>
          </div>
          {paymentMethod === "credits" && (
            <div className="flex justify-between">
              <span>Credits Remaining:</span>
              <span>{userCredits - sessionCost} credits</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {paymentMethod === "credits" ? (
          <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700">
            Confirm & Book
          </Button>
        ) : (
          <PaystackPayment
            amount={sessionPrice}
            email={userEmail}
            reference={`session_${selectedTherapistId}_${Date.now()}`}
            metadata={{
              type: 'session',
              therapistId: selectedTherapistId,
              timeSlotId: selectedSlot.id,
              patientData: patientData,
              // We'll create the session after payment is successful
              createSession: true
            }}
            onSuccess={handlePaystackSuccess}
            onError={handlePaystackError}
            buttonText="Pay for Session"
            className="bg-blue-600 hover:bg-blue-700"
          />
        )}
      </div>
    </div>
  )
}
