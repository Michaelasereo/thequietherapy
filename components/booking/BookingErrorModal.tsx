"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, CreditCard, RefreshCw, Calendar, User } from "lucide-react"

interface BookingErrorModalProps {
  isOpen: boolean
  onClose: () => void
  errorType: 'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic'
  errorMessage?: string
  selectedSlot?: {
    date: string
    start_time: string
    end_time: string
  }
  onRetry?: () => void
  onSelectNewSlot?: () => void
}

export default function BookingErrorModal({
  isOpen,
  onClose,
  errorType,
  errorMessage,
  selectedSlot,
  onRetry,
  onSelectNewSlot
}: BookingErrorModalProps) {
  
  const getErrorConfig = () => {
    switch (errorType) {
      case 'slot_unavailable':
        return {
          icon: Clock,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          title: '⏰ Time Slot No Longer Available',
          description: 'This time slot has been booked by another user. Please select a different time.',
          primaryAction: 'Select New Time',
          secondaryAction: 'Try Again',
          primaryColor: 'bg-orange-600 hover:bg-orange-700',
          secondaryColor: 'border-orange-300 text-orange-700 hover:bg-orange-50'
        }
      
      case 'insufficient_credits':
        return {
          icon: CreditCard,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '💳 Insufficient Credits',
          description: 'You need to purchase a session package before booking. Please buy credits to continue.',
          primaryAction: 'Buy Credits',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          secondaryColor: 'border-red-300 text-red-700 hover:bg-red-50'
        }
      
      case 'past_time':
        return {
          icon: Calendar,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '📅 Past Time Slot',
          description: 'You cannot book sessions for past dates or times. Please select a future time slot.',
          primaryAction: 'Select New Time',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          secondaryColor: 'border-red-300 text-red-700 hover:bg-red-50'
        }
      
      case 'conflict':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '⚠️ Booking Conflict',
          description: 'There is a scheduling conflict with this time slot. Please choose a different time.',
          primaryAction: 'Select New Time',
          secondaryAction: 'Try Again',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          secondaryColor: 'border-red-300 text-red-700 hover:bg-red-50'
        }
      
      case 'network':
        return {
          icon: RefreshCw,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          title: '🌐 Connection Error',
          description: 'There was a problem connecting to our servers. Please check your internet connection and try again.',
          primaryAction: 'Try Again',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-blue-600 hover:bg-blue-700',
          secondaryColor: 'border-blue-300 text-blue-700 hover:bg-blue-50'
        }
      
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '❌ Booking Failed',
          description: errorMessage || 'An unexpected error occurred. Please try again.',
          primaryAction: 'Try Again',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          secondaryColor: 'border-red-300 text-red-700 hover:bg-red-50'
        }
    }
  }

  const config = getErrorConfig()
  const IconComponent = config.icon

  const handlePrimaryAction = () => {
    if (errorType === 'slot_unavailable' || errorType === 'past_time' || errorType === 'conflict') {
      onSelectNewSlot?.()
    } else if (errorType === 'insufficient_credits') {
      // Redirect to payment page or show payment modal
      window.location.href = '/dashboard/packages'
    } else {
      onRetry?.()
    }
    onClose()
  }

  const handleSecondaryAction = () => {
    if (errorType === 'slot_unavailable' || errorType === 'conflict' || errorType === 'network') {
      onRetry?.()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-red-800">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Details */}
          {selectedSlot && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Selected Time Slot</p>
                  <p className="text-sm text-red-600">
                    {selectedSlot.date} at {selectedSlot.start_time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Error Details</p>
                  <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Helpful Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Need Help?</p>
                <ul className="space-y-1 text-blue-700">
                  {errorType === 'slot_unavailable' && (
                    <>
                      <li>• Try selecting a different time slot</li>
                      <li>• Check if the therapist has other available times</li>
                      <li>• Consider booking for a different date</li>
                    </>
                  )}
                  {errorType === 'insufficient_credits' && (
                    <>
                      <li>• Purchase a session package to get credits</li>
                      <li>• Check your credit balance in your dashboard</li>
                      <li>• Contact support if you have payment issues</li>
                    </>
                  )}
                  {errorType === 'past_time' && (
                    <>
                      <li>• Select a future date and time</li>
                      <li>• Check your device's date and time settings</li>
                      <li>• Try refreshing the page to get current times</li>
                    </>
                  )}
                  {errorType === 'network' && (
                    <>
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Contact support if the problem persists</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePrimaryAction}
              className={`flex-1 ${config.primaryColor} text-white`}
            >
              {config.primaryAction}
            </Button>
            
            {(errorType === 'slot_unavailable' || errorType === 'conflict' || errorType === 'network') && (
              <Button 
                onClick={handleSecondaryAction}
                variant="outline"
                className={`flex-1 ${config.secondaryColor}`}
              >
                {config.secondaryAction}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
