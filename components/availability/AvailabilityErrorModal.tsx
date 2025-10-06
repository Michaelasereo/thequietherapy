"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Save, RefreshCw, Calendar, Clock } from "lucide-react"

interface AvailabilityErrorModalProps {
  isOpen: boolean
  onClose: () => void
  errorType: 'save_failed' | 'load_failed' | 'network' | 'validation' | 'generic'
  errorMessage?: string
  onRetry?: () => void
  onRefresh?: () => void
}

export default function AvailabilityErrorModal({
  isOpen,
  onClose,
  errorType,
  errorMessage,
  onRetry,
  onRefresh
}: AvailabilityErrorModalProps) {
  
  const getErrorConfig = () => {
    switch (errorType) {
      case 'save_failed':
        return {
          icon: Save,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '💾 Failed to Save Availability',
          description: 'Your availability schedule could not be saved. Please try again.',
          primaryAction: 'Try Again',
          secondaryAction: 'Refresh Page',
          primaryColor: 'bg-red-600 hover:bg-red-700',
          secondaryColor: 'border-red-300 text-red-700 hover:bg-red-50'
        }
      
      case 'load_failed':
        return {
          icon: Calendar,
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-100',
          title: '📅 Failed to Load Availability',
          description: 'Could not load your current availability schedule. Please refresh and try again.',
          primaryAction: 'Refresh',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-orange-600 hover:bg-orange-700',
          secondaryColor: 'border-orange-300 text-orange-700 hover:bg-orange-50'
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
      
      case 'validation':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          title: '⚠️ Invalid Schedule',
          description: 'Your availability schedule has some issues. Please check the highlighted fields and try again.',
          primaryAction: 'Fix Issues',
          secondaryAction: 'Cancel',
          primaryColor: 'bg-yellow-600 hover:bg-yellow-700',
          secondaryColor: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
        }
      
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          title: '❌ Error',
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
    if (errorType === 'save_failed' || errorType === 'network') {
      onRetry?.()
    } else if (errorType === 'load_failed') {
      onRefresh?.()
    } else if (errorType === 'validation') {
      // Close modal to show validation errors
      onClose()
    }
  }

  const handleSecondaryAction = () => {
    if (errorType === 'save_failed' || errorType === 'load_failed') {
      onRefresh?.()
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
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Troubleshooting Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  {errorType === 'save_failed' && (
                    <>
                      <li>• Check your internet connection</li>
                      <li>• Try saving your schedule again</li>
                      <li>• Contact support if the problem persists</li>
                    </>
                  )}
                  {errorType === 'load_failed' && (
                    <>
                      <li>• Refresh the page to reload your schedule</li>
                      <li>• Check if you have any availability set</li>
                      <li>• Try logging out and back in</li>
                    </>
                  )}
                  {errorType === 'network' && (
                    <>
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Contact support if the problem persists</li>
                    </>
                  )}
                  {errorType === 'validation' && (
                    <>
                      <li>• Check that all time slots are valid</li>
                      <li>• Ensure start times are before end times</li>
                      <li>• Make sure you have at least one available day</li>
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
            
            <Button 
              onClick={handleSecondaryAction}
              variant="outline"
              className={`flex-1 ${config.secondaryColor}`}
            >
              {config.secondaryAction}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
