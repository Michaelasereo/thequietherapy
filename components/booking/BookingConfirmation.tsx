"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, User, Calendar, CreditCard, AlertCircle, ShoppingCart, Loader2 } from "lucide-react"
import { TimeSlot } from "@/lib/services/availabilityService"
import { toast } from "sonner"
import { isPastDate, isValidBookingDate, formatDate, formatTime } from "@/lib/utils/dateValidation"
import BookingErrorModal from "./BookingErrorModal"
import { useAuth } from "@/context/auth-context"

interface BookingConfirmationProps {
  therapistId: string
  therapistInfo: any
  selectedSlot: TimeSlot
  onBookingComplete: (confirmation: any) => void
  onBack: () => void
}

interface Package {
  package_type: string
  name: string
  description: string
  sessions_included: number
  price_kobo: number
  session_duration_minutes: number
  savings_kobo: number
}

export default function BookingConfirmation({ 
  therapistId, 
  therapistInfo, 
  selectedSlot, 
  onBookingComplete, 
  onBack 
}: BookingConfirmationProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sessionNotes, setSessionNotes] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [checkingCredits, setCheckingCredits] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorType, setErrorType] = useState<'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic'>('generic')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Utility function for safe array operations
  const safeFilter = (array: any[] | undefined | null, predicate: (item: any) => boolean): any[] => {
    if (!array || !Array.isArray(array)) return []
    return array.filter((item) => item && predicate(item))
  }

  // Check user credits and fetch packages on component mount
  useEffect(() => {
    const checkUserCredits = async () => {
      try {
        setCheckingCredits(true)
        
        // Initialize with safe defaults
        setUserCredits(0)
        setPackages([])
        setSelectedPackage("")
        
        // Check user credits
        console.log('🔍 Fetching user credits...')
        const creditsResponse = await fetch('/api/credits/user')
        console.log('🔍 Credits response status:', creditsResponse.status)
        
        if (!creditsResponse.ok) {
          console.warn('Credits API not available, assuming no credits')
          setUserCredits(0)
        } else {
          const creditsData = await creditsResponse.json()
          console.log('🔍 Credits data received:', creditsData)
          
          if (creditsData.success) {
            setUserCredits(creditsData.data.total_credits || 0)
          } else {
            console.warn('Failed to fetch credits, assuming no credits:', creditsData)
            setUserCredits(0)
          }
        }

        // Fetch available packages
        const packagesResponse = await fetch('/api/packages')
        const packagesData = await packagesResponse.json()
        
        if (packagesResponse.ok && packagesData.success) {
          console.log('Packages data received:', packagesData.data?.packages)
          // Use safe filter utility to prevent undefined errors
          const paidPackages = safeFilter(packagesData.data?.packages, (pkg: Package) => 
            pkg.package_type !== 'signup_free' && pkg.price_kobo > 0
          ).sort((a: Package, b: Package) => a.price_kobo - b.price_kobo)
          
          console.log('Filtered paid packages:', paidPackages)
          setPackages(paidPackages)
          
          // Auto-select the single session package if available
          const singlePackage = paidPackages.find((pkg: Package) => 
            pkg && pkg.package_type === 'single'
          )
          if (singlePackage) {
            console.log('Auto-selecting single package:', singlePackage.package_type)
            setSelectedPackage(singlePackage.package_type)
          } else if (paidPackages.length > 0) {
            // If no single package, select the first (cheapest) package
            console.log('Auto-selecting first package:', paidPackages[0].package_type)
            setSelectedPackage(paidPackages[0].package_type)
          }
        } else {
          // Handle API error gracefully
          console.warn('Failed to fetch packages, using empty array:', packagesData)
          setPackages([])
        }
      } catch (error) {
        console.error('Error checking credits/packages:', error)
        
        // Set safe defaults on error to prevent UI crashes
        setUserCredits(0)
        setPackages([])
        setSelectedPackage("")
        
        // Show user-friendly error message
        toast.error('Failed to load payment information. Please refresh the page.')
      } finally {
        setCheckingCredits(false)
      }
    }

    checkUserCredits()
  }, [])

  // Handle payment success from URL params (after returning from Paystack)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const credits = searchParams.get('credits')
    const reference = searchParams.get('reference')
    
    if (paymentStatus === 'success') {
      console.log('✅ Payment success detected in URL params')
      console.log('   Credits added:', credits)
      console.log('   Reference:', reference)
      
      // Show success message
      toast.success(`Payment successful! ${credits ? `${credits} credits have been added to your account.` : 'Credits have been added to your account.'}`)
      
      // Refresh credits immediately
      const refreshCredits = async () => {
        try {
          const creditsResponse = await fetch('/api/credits/user')
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json()
            if (creditsData.success) {
              const newCredits = creditsData.data.total_credits || 0
              console.log('💰 Updated credits:', newCredits)
              setUserCredits(newCredits)
            }
          }
        } catch (error) {
          console.error('Error refreshing credits:', error)
        }
      }
      
      refreshCredits()
      
      // Clean up URL params
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        url.searchParams.delete('credits')
        url.searchParams.delete('reference')
        window.history.replaceState({}, '', url.toString())
      }
    } else if (paymentStatus === 'failed') {
      const error = searchParams.get('error')
      toast.error(error || "Payment was not completed. Please try again.")
      
      // Clean up URL params
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        url.searchParams.delete('error')
        url.searchParams.delete('reference')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // Check for pending booking after payment return (legacy - kept for compatibility)
  useEffect(() => {
    const pendingBooking = sessionStorage.getItem('pendingBooking')
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking)
        // Clear the pending booking
        sessionStorage.removeItem('pendingBooking')
        
        console.log('📋 Found pending booking data:', bookingData)
        
        // If credits are now available, show message
        if (userCredits > 0) {
          toast.success("Payment successful! You now have credits. You can proceed to book.")
        }
      } catch (error) {
        console.error('Error processing pending booking:', error)
        sessionStorage.removeItem('pendingBooking')
      }
    }
  }, [userCredits])

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrice = (priceKobo: number) => {
    return `₦${(priceKobo / 100).toLocaleString()}`
  }

  const handlePaymentInitiation = async () => {
    console.log('🔘 Payment button clicked')
    console.log('   Selected package:', selectedPackage)
    console.log('   Packages:', packages.length)
    console.log('   User authenticated:', isAuthenticated)
    console.log('   User email:', user?.email)

    if (!selectedPackage) {
      console.warn('❌ No package selected')
      toast.error("Please select a package first")
      return
    }

    const selectedPackageData = packages.find(pkg => pkg.package_type === selectedPackage)
    if (!selectedPackageData) {
      console.error('❌ Selected package data not found')
      toast.error("Selected package not found. Please refresh and try again.")
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user?.email) {
      console.error('❌ User not authenticated')
      toast.error("Please log in to purchase credits. Redirecting to login...")
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }, 2000)
      return
    }

    console.log('✅ Starting payment initialization...')
    try {
      setPaymentLoading(true)
      
      // Use user email from auth context
      const userEmail = user.email
      console.log('📧 Using email:', userEmail)

      // Convert kobo to Naira for the API (which expects Naira)
      const amountInNaira = selectedPackageData.price_kobo / 100
      const reference = `package_${selectedPackage}_${Date.now()}`
      
      console.log('💰 Payment details:', {
        package: selectedPackage,
        amountNaira: amountInNaira,
        sessions: selectedPackageData.sessions_included,
        reference
      })
      
      // Store booking information in sessionStorage for after payment
      const bookingData = {
        therapistId,
        selectedSlot,
        sessionNotes,
        emergencyContact,
        therapistInfo
      }
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))
      console.log('💾 Stored booking data in sessionStorage')

      // Use standardized Paystack initialize endpoint
      console.log('🔗 Calling /api/paystack/initialize...')
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInNaira, // Send in Naira - backend converts to kobo
          email: userEmail,
          reference: reference,
          callback_url: `${window.location.origin}/dashboard/book?payment=success`,
          metadata: {
            type: 'package_purchase',
            package_type: selectedPackage,
            sessions_included: selectedPackageData.sessions_included,
            therapistId: therapistId,
            timeSlotId: selectedSlot.id,
            sessionDate: selectedSlot.date,
            sessionTime: selectedSlot.start_time,
          },
        }),
      })

      console.log('📡 Payment API response status:', response.status)
      const result = await response.json()
      console.log('🔍 Payment initiation response:', result)

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Payment initialization failed'
        console.error('❌ Payment initialization failed:', errorMsg)
        throw new Error(errorMsg)
      }

      // Validate authorization URL
      if (!result.data?.authorization_url) {
        console.error('❌ Missing authorization_url in response:', result)
        throw new Error('Payment gateway did not return a valid payment URL. Please try again.')
      }
      
      console.log('✅ Payment initialized successfully, redirecting to:', result.data.authorization_url)
      
      // Redirect to Paystack payment page
      window.location.href = result.data.authorization_url
    } catch (error) {
      console.error('❌ Error initiating payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment'
      toast.error(errorMessage)
      setPaymentLoading(false)
    }
  }

  const handleRetryBooking = () => {
    setShowErrorModal(false)
    setError(null)
    handleConfirmBooking()
  }

  const handleSelectNewSlot = () => {
    setShowErrorModal(false)
    setError(null)
    // This will trigger the parent component to go back to time selection
    onBack()
  }

  const handleConfirmBooking = async () => {
    try {
      console.log('🔍 DEBUG: Starting booking process...')
      setLoading(true)
      setError(null) // Clear previous errors
      setBookingSuccess(false) // Reset success state
      console.log('🔍 DEBUG: Reset bookingSuccess to false')

      // 1. Validate input first
      if (!agreedToTerms) {
        setError("Please agree to the terms and conditions")
        return
      }

      // 2. Check if user has credits
      if (userCredits === 0) {
        setError("You need to purchase a session package first. Please select a package and pay to continue.")
        return
      }

      // 3. Validate date and time
      const dateValidation = isValidBookingDate(selectedSlot.date, selectedSlot.start_time)
      if (!dateValidation.isValid) {
        setError(dateValidation.error || "Invalid booking date or time")
        return
      }

      // 4. Validate required data
      if (!therapistId) {
        setError("Therapist information is missing. Please try again.")
        return
      }

      if (!selectedSlot.date || !selectedSlot.start_time) {
        setError("Session date and time are required.")
        return
      }

      console.log('🔍 DEBUG: Booking data being sent:', {
        therapist_id: therapistId,
        session_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        duration: selectedSlot.session_duration,
        session_type: selectedSlot.session_type === 'individual' ? 'video' : 'video',
        notes: sessionNotes || `Emergency contact: ${emergencyContact || 'Not provided'}`
      })
      
      console.log('🔍 DEBUG: Selected slot details:', {
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        therapist_id: therapistId,
        user_credits: userCredits
      })

      // 5. Proceed with booking using AvailabilityManager for conflict prevention
      const bookingData = {
        therapist_id: therapistId,
        session_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        duration: selectedSlot.session_duration,
        session_type: selectedSlot.session_type === 'individual' ? 'video' : 'video',
        notes: sessionNotes || `Emergency contact: ${emergencyContact || 'Not provided'}`
      }

      console.log('🔍 DEBUG: Sending booking request to API with conflict prevention...')
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANT: Include cookies for authentication
        body: JSON.stringify(bookingData),
      })

      console.log('🔍 DEBUG: API response status:', response.status)
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Booking API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Booking failed: ${response.status} ${response.statusText}`)
      }
      
      // Check if response has content before parsing JSON
      const responseText = await response.text()
      if (!responseText) {
        console.error('❌ Empty response from booking API')
        throw new Error('Empty response from server')
      }
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Invalid JSON response:', responseText)
        throw new Error('Invalid response format from server')
      }
      
      console.log('🔍 DEBUG: API response data:', result)
      console.log('🔍 DEBUG: result.success:', result.success)
      console.log('🔍 DEBUG: result.data:', result.data)
      console.log('🔍 DEBUG: result.data?.session:', result.data?.session)

      if (response.ok && result.success) {
        console.log('🔍 DEBUG: ✅ Booking successful! Response:', result)
        console.log('🔍 DEBUG: Session ID:', result.data?.session?.id)
        
        // Credit deduction is now handled automatically by the booking API
        console.log('🔍 DEBUG: ✅ Booking successful with automatic credit deduction!')
        console.log('🔍 DEBUG: Setting bookingSuccess to true...')
        setBookingSuccess(true)
        console.log('🔍 DEBUG: Calling onBookingComplete with result:', result)
        toast.success("Booking confirmed successfully! Credit deducted automatically.")
        
        // Force refresh the dashboard to show the new session
        console.log('🔄 Refreshing dashboard after successful booking...')
        if (typeof window !== 'undefined') {
          // Trigger a custom event to refresh dashboard
          window.dispatchEvent(new CustomEvent('bookingCompleted', { 
            detail: { sessionId: result.data?.session?.id } 
          }))
        }
        
        onBookingComplete(result)
      } else {
        // Handle API errors gracefully with specific error types
        console.log('🔍 DEBUG: Booking failed with status:', response.status)
        console.log('🔍 DEBUG: Error details:', result)
        
        // Ensure success state is false when booking fails
        console.log('🔍 DEBUG: Booking failed - ensuring bookingSuccess is false')
        setBookingSuccess(false)
        
        let errorMessage = 'Booking failed'
        let errorType: 'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic' = 'generic'
        
        if (response.status === 409) {
          errorMessage = 'This time slot is no longer available. Please select a different time.'
          errorType = 'slot_unavailable'
        } else if (response.status === 402) {
          errorMessage = 'You need to purchase a session package before booking. Please buy credits to continue.'
          errorType = 'insufficient_credits'
        } else if (response.status === 400 && result.error?.includes('past')) {
          errorMessage = 'You cannot book sessions for past dates or times. Please select a future time slot.'
          errorType = 'past_time'
        } else if (response.status === 409 && result.error?.includes('conflict')) {
          errorMessage = 'There is a scheduling conflict with this time slot. Please choose a different time.'
          errorType = 'conflict'
        } else if (response.status >= 500) {
          errorMessage = 'There was a problem connecting to our servers. Please check your internet connection and try again.'
          errorType = 'network'
        } else if (result.error) {
          errorMessage = result.error
        } else if (result.message) {
          errorMessage = result.message
        }
        
        console.log('🔍 DEBUG: Final error message:', errorMessage)
        console.log('🔍 DEBUG: Error type:', errorType)
        
        // Set error modal state
        setErrorType(errorType)
        setErrorMessage(errorMessage)
        setShowErrorModal(true)
        
        // Also set the old error state for backward compatibility
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm booking'
      
      // Determine error type based on error message
      let errorType: 'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic' = 'generic'
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorType = 'network'
      } else if (errorMessage.includes('past')) {
        errorType = 'past_time'
      } else if (errorMessage.includes('conflict')) {
        errorType = 'conflict'
      } else if (errorMessage.includes('credit')) {
        errorType = 'insufficient_credits'
      }
      
      // Set error modal state
      setErrorType(errorType)
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
      
      // Also set the old error state for backward compatibility
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Debug logging for success state
  console.log('🔍 DEBUG: BookingConfirmation render - bookingSuccess:', bookingSuccess)
  console.log('🔍 DEBUG: BookingConfirmation render - loading:', loading)
  console.log('🔍 DEBUG: BookingConfirmation render - error:', error)
  
  // Debug the success modal rendering
  if (bookingSuccess) {
    console.log('🔍 DEBUG: Success modal should be visible!')
  }

  return (
    <div className="space-y-6">
      {/* Error Modal */}
      <BookingErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorType={errorType}
        errorMessage={errorMessage}
        selectedSlot={selectedSlot}
        onRetry={handleRetryBooking}
        onSelectNewSlot={handleSelectNewSlot}
      />

      {/* Success Modal */}
      <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-green-800">
              🎉 Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Your therapy session has been scheduled successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Session Details</p>
                  <p className="text-sm text-green-600">
                    {selectedSlot.date} at {selectedSlot.start_time}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                You will receive a confirmation email with your session link shortly.
              </p>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => {
                  setBookingSuccess(false)
                  // Redirect to dashboard after closing the modal
                  router.push('/dashboard')
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold">Unable to Book</h3>
                <p className="text-red-600">{error}</p>
                {error.includes('past dates') && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-red-700 underline mt-2 text-sm hover:text-red-800"
                  >
                    Check current availability
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Therapist Info */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-lg">
                {therapistInfo?.name?.charAt(0) || 'T'}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">{therapistInfo?.name}</h4>
              <p className="text-sm text-green-700">{therapistInfo?.specialization}</p>
              <p className="text-sm text-green-600">₦{therapistInfo?.hourly_rate?.toLocaleString() || '5,000'}/hr</p>
            </div>
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Date</p>
                <p className="text-sm text-green-700">{formatDate(selectedSlot.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Time</p>
                <p className="text-sm text-green-700">
                  {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Duration</p>
                <p className="text-sm text-green-700">{selectedSlot.session_duration} minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Session Type</p>
                <p className="text-sm text-green-700 capitalize">{selectedSlot.session_type}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Date Warning */}
      {isPastDate(selectedSlot.date, selectedSlot.start_time) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-semibold">Past Time Slot</h3>
                <p className="text-red-600">This time slot has passed. Please select a future time.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-red-700 underline mt-2 text-sm hover:text-red-800"
                >
                  Check current availability
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section - Show if user has no credits */}
      {!checkingCredits && userCredits === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              No Session Credits Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-100 rounded-lg border border-orange-200">
              <p className="text-orange-900 font-semibold text-base mb-2">
                ⚠️ You need to purchase credits before booking
              </p>
              <p className="text-orange-800 text-sm">
                To book this session, you must first buy a session package. Select a package below and complete payment. After payment, you'll be able to book your session with this therapist.
              </p>
            </div>

            {/* Package Selection */}
            <div className="space-y-3">
              <Label className="text-orange-900 font-medium">Select a Package:</Label>
              {packages.length === 0 ? (
                <div className="p-4 bg-orange-100 rounded-lg border border-orange-200">
                  <p className="text-orange-800 text-sm">
                    No packages available at the moment. Please try again later or contact support.
                  </p>
                </div>
              ) : (
                packages.map((pkg) => (
                <div
                  key={pkg.package_type}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPackage === pkg.package_type
                      ? 'border-orange-500 bg-orange-100'
                      : 'border-orange-200 hover:border-orange-300'
                  }`}
                  onClick={() => setSelectedPackage(pkg.package_type)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900">{pkg.name}</h4>
                      <p className="text-sm text-orange-700 mt-1">{pkg.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-orange-600">
                        <span>{pkg.sessions_included} session{pkg.sessions_included > 1 ? 's' : ''}</span>
                        <span>{pkg.session_duration_minutes} minutes each</span>
                        {pkg.savings_kobo > 0 && (
                          <span className="text-green-600 font-medium">
                            Save {formatPrice(pkg.savings_kobo)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-900">
                        {formatPrice(pkg.price_kobo)}
                      </div>
                      {pkg.sessions_included > 1 && (
                        <div className="text-sm text-orange-600">
                          {formatPrice(pkg.price_kobo / pkg.sessions_included)}/session
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePaymentInitiation}
              disabled={!selectedPackage || paymentLoading || packages.length === 0 || !isAuthenticated || authLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment - Buy Credits First
                </>
              )}
            </Button>

            <p className="text-xs text-orange-700 text-center mt-2">
              ℹ️ After successful payment, you'll return here to complete your booking
            </p>
          </CardContent>
        </Card>
      )}

      {/* Credit Status - Show if user has credits */}
      {!checkingCredits && userCredits > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">You have {userCredits} session credit{userCredits > 1 ? 's' : ''} available</p>
                <p className="text-sm text-green-700">Your booking will use 1 credit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {checkingCredits && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              <p className="text-gray-700">Checking your credits...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Notes */}
          <div className="space-y-2">
            <Label htmlFor="sessionNotes">What would you like to focus on today? (Optional)</Label>
            <Textarea
              id="sessionNotes"
              placeholder="Share any specific topics, concerns, or goals you'd like to discuss during your session..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
            <Input
              id="emergencyContact"
              type="tel"
              placeholder="Phone number of someone we can contact in case of emergency"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="terms" className="font-medium cursor-pointer">
                I agree to the terms and conditions
              </label>
              <p className="text-gray-600 mt-1">
                By confirming this booking, I understand that this is a therapy session and agree to the 
                platform's terms of service and privacy policy. I understand that I may cancel this session 
                up to 24 hours before the scheduled time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack} disabled={loading || paymentLoading}>
          Back to Time Selection
        </Button>
        
        {/* Show different button based on credit status */}
        {!checkingCredits && userCredits > 0 && (
          <Button 
            onClick={handleConfirmBooking}
            disabled={loading || !agreedToTerms || isPastDate(selectedSlot.date, selectedSlot.start_time)}
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirming Booking...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Booking
              </>
            )}
          </Button>
        )}

        {!checkingCredits && userCredits === 0 && (
          <Button 
            disabled={true}
            className="bg-gray-400 cursor-not-allowed text-white"
            title="Please buy credits above first"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Credits Above to Enable Booking
          </Button>
        )}

        {/* Hidden button for backward compatibility - no longer shown */}
        {false && !checkingCredits && userCredits === 0 && (
          <Button 
            onClick={handlePaymentInitiation}
            disabled={!selectedPackage || paymentLoading || !agreedToTerms || packages.length === 0 || isPastDate(selectedSlot.date, selectedSlot.start_time)}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400"
          >
            {paymentLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Credits & Book Session
              </>
            )}
          </Button>
        )}

        {checkingCredits && (
          <Button disabled className="bg-gray-400 text-white">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        )}
      </div>

      {/* Disable button hint for past dates */}
      {isPastDate(selectedSlot.date, selectedSlot.start_time) && (
        <div className="text-center">
          <p className="text-sm text-red-600">
            This time slot has passed. Please select a future time to continue with your booking.
          </p>
        </div>
      )}

      {/* Important Notes */}
      <Card className="border-brand-gold bg-brand-gold/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-brand-gold mt-0.5" />
            <div className="text-sm text-gray-900">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="space-y-1 text-gray-900">
                <li>• You will receive a confirmation email with session details</li>
                <li>• A calendar invite will be sent to your email</li>
                <li>• You can join the session 5 minutes before the scheduled time</li>
                <li>• Cancellations must be made at least 24 hours in advance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
