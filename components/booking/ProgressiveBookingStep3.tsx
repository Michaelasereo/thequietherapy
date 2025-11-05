"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { TimeSlot } from "@/lib/services/availabilityService"
import DatePicker from "./DatePicker"
import TimeSlotGrid from "./TimeSlotGrid"
import BookingConfirmation from "./BookingConfirmation"

interface ProgressiveBookingStep3Props {
  onNext: (selectedSlot: TimeSlot) => void
  onBack: () => void
  selectedTherapistId: string
  selectedTherapistData?: any
}

type BookingStep = 'date' | 'time' | 'confirmation'

export default function ProgressiveBookingStep3({ 
  onNext, 
  onBack, 
  selectedTherapistId, 
  selectedTherapistData 
}: ProgressiveBookingStep3Props) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  // Safety check - don't render if props are missing
  if (!onNext || !onBack || !selectedTherapistId) {
    console.error('Missing required props:', { onNext: !!onNext, onBack: !!onBack, selectedTherapistId: !!selectedTherapistId })
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error: Missing required props</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setCurrentStep('time')
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setCurrentStep('confirmation')
  }

  const handleBookingComplete = (confirmation: any) => {
    console.log('🔍 DEBUG: handleBookingComplete called with:', confirmation)
    setBookingConfirmation(confirmation)
    console.log('🔍 DEBUG: Booking confirmation set, calling onNext...')
    // Call the original onNext with the selected slot and mark that booking is already complete
    if (selectedSlot) {
      // Mark booking as complete and pass confirmation data
      // Type assertion needed because TimeSlot doesn't include these properties
      onNext({
        ...selectedSlot,
        bookingAlreadyComplete: true,
        confirmation: confirmation
      } as TimeSlot & { bookingAlreadyComplete: boolean; confirmation: any })
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'time':
        setCurrentStep('date')
        setSelectedDate('')
        break
      case 'confirmation':
        setCurrentStep('time')
        setSelectedSlot(null)
        break
      default:
        onBack()
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'date':
        return 'Select a Date'
      case 'time':
        return 'Choose a Time'
      case 'confirmation':
        return 'Confirm Booking'
      default:
        return 'Select Available Time'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'date':
        return `Choose a date for your session with ${selectedTherapistData?.name || 'your therapist'}`
      case 'time':
        return 'Select your preferred time slot'
      case 'confirmation':
        return 'Review and confirm your booking details'
      default:
        return 'Complete your session booking'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-semibold">{getStepTitle()}</h3>
        </div>
        <p className="text-sm text-muted-foreground ml-10">
          {getStepDescription()}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {['date', 'time', 'confirmation'].map((step, index) => {
          const isActive = step === currentStep
          const isCompleted = ['date', 'time', 'confirmation'].indexOf(currentStep) > index
          const isAccessible = index === 0 || isCompleted || isActive
          
          return (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-600 text-white' : ''}
                ${isActive ? 'bg-black text-white' : ''}
                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div className={`
                  w-16 h-0.5 mx-2
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 'date' && (
          <DatePicker
            therapistId={selectedTherapistId}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        )}

        {currentStep === 'time' && selectedDate && (
          <TimeSlotGrid
            therapistId={selectedTherapistId}
            selectedDate={selectedDate}
            onSlotSelect={handleSlotSelect}
            selectedSlot={selectedSlot || undefined}
          />
        )}

        {currentStep === 'confirmation' && selectedSlot && (
          <BookingConfirmation
            therapistId={selectedTherapistId}
            therapistInfo={selectedTherapistData}
            selectedSlot={selectedSlot || undefined}
            onBookingComplete={handleBookingComplete}
            onBack={() => setCurrentStep('time')}
          />
        )}
      </div>

      {/* Therapist Summary (Always visible) */}
      {selectedTherapistData && (
        <Card className="bg-gray-50 border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-900 font-semibold text-lg">
                  {selectedTherapistData.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{selectedTherapistData.name}</h4>
                <p className="text-sm text-gray-700">{selectedTherapistData.specialization}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ₦{selectedTherapistData.hourly_rate?.toLocaleString() || '5,000'}/hr
                </p>
                <p className="text-xs text-gray-600">Session Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
