"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import PaystackPayment from "@/components/paystack-payment"
import { formatAmountForDisplay } from "@/lib/paystack-client"
import { CheckCircle, Clock, User, ShoppingCart, Star } from "lucide-react"

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

interface Package {
  package_type: string
  name: string
  description: string
  sessions_included: number
  price_kobo: number
  savings_kobo: number
  session_duration_minutes: number
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
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [loading, setLoading] = useState(true)
  
  // Use patient's email from the form
  const userEmail = patientData?.email || ""

  // Load packages on mount
  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credit-packages')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Filter out free signup package and sort by price
          const paidPackages = data.data?.packages
            ?.filter((pkg: Package) => pkg.package_type !== 'signup_free' && pkg.price_kobo > 0)
            ?.sort((a: Package, b: Package) => a.price_kobo - b.price_kobo) || []
          
          setPackages(paidPackages)
          
          // Auto-select the single session package if available
          const singlePackage = paidPackages.find((pkg: Package) => pkg.package_type === 'single')
          if (singlePackage) {
            setSelectedPackage(singlePackage.package_type)
          } else if (paidPackages.length > 0) {
            setSelectedPackage(paidPackages[0].package_type)
          }
        }
      }
    } catch (error) {
      console.error('Error loading packages:', error)
      toast({
        title: "Error",
        description: "Failed to load packages. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedPackageData = packages.find(pkg => pkg.package_type === selectedPackage)

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

  const handlePaystackSuccess = (data: any) => {
    // Payment successful - trigger the verification modal
    onCheckout()
  }

  const handlePaystackError = (error: string) => {
    console.error('Paystack payment error:', error)
    toast({
      title: "Payment Failed",
      description: "There was an error processing your payment. Please try again.",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShoppingCart className="h-6 w-6 text-gray-900" />
          <h3 className="text-xl font-semibold">Purchase Session Package</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You need to purchase a session package to book this appointment. Choose from the options below and pay to get credits.
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.package_type}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPackage === pkg.package_type 
                ? 'ring-2 ring-brand-gold bg-brand-gold/10' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedPackage(pkg.package_type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.package_type === 'bronze' && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {pkg.sessions_included} {pkg.sessions_included === 1 ? 'session' : 'sessions'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pkg.session_duration_minutes} minutes each
                </div>
              </div>
              
              {pkg.savings_kobo > 0 && (
                <div className="text-center">
                  <div className="text-sm text-green-600 font-medium">
                    Save {formatAmountForDisplay(pkg.savings_kobo)}
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatAmountForDisplay(pkg.price_kobo)}
                </div>
                {pkg.sessions_included > 1 && (
                  <div className="text-sm text-muted-foreground">
                    {formatAmountForDisplay(pkg.price_kobo / pkg.sessions_included)} per session
                  </div>
                )}
              </div>

              {selectedPackage === pkg.package_type && (
                <div className="flex items-center justify-center text-brand-gold">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session Summary */}
      {selectedPackageData && (
        <Card className="bg-gray-50 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle className="h-5 w-5" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{patientData.firstName}</h4>
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
                  {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.start_time)}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedPackageData.session_duration_minutes} minutes • Individual Session
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {selectedPackageData ? (
          <PaystackPayment
            amount={selectedPackageData.price_kobo}
            email={userEmail}
            reference={`package_${selectedPackage}_${Date.now()}`}
            metadata={{
              type: 'package_purchase',
              package_type: selectedPackage,
              sessions_included: selectedPackageData.sessions_included,
              therapistId: selectedTherapistId,
              timeSlotId: selectedSlot.id,
              sessionDate: selectedSlot.date,
              sessionTime: selectedSlot.start_time,
              patientData: {
                firstName: patientData.firstName,
                email: patientData.email,
                phone: patientData.phone,
                country: patientData.country,
                complaints: patientData.complaints,
                age: patientData.age,
                gender: patientData.gender,
                maritalStatus: patientData.maritalStatus,
              },
            }}
            onSuccess={handlePaystackSuccess}
            onError={handlePaystackError}
            buttonText="Buy Credits & Book Session"
            className="bg-black hover:bg-gray-800"
          />
        ) : (
          <Button disabled className="bg-gray-400">
            Select a Package
          </Button>
        )}
      </div>
    </div>
  )
}
