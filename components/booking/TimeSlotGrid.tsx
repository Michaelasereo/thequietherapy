"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, AlertCircle, RefreshCw } from "lucide-react"
import { AvailabilityService, TimeSlot } from "@/lib/services/availabilityService"
import { filterOutPastSlots } from "@/lib/utils/dateValidation"
import BookingErrorModal from "./BookingErrorModal"

interface TimeSlotGridProps {
  therapistId: string
  selectedDate: string
  onSlotSelect: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot
}

export default function TimeSlotGrid({ therapistId, selectedDate, onSlotSelect, selectedSlot }: TimeSlotGridProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorType, setErrorType] = useState<'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic'>('generic')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  useEffect(() => {
    fetchTimeSlots()
    
    // Set up periodic refresh to catch availability changes
    // This ensures users see updated availability even without real-time features
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing time slots to catch availability changes...')
      fetchTimeSlots()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval)
  }, [therapistId, selectedDate])

  const fetchTimeSlots = async (showRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 TimeSlotGrid: Fetching fresh time slots for:', { therapistId, selectedDate })
      
      const timeSlots = await AvailabilityService.getTimeSlots(therapistId, selectedDate)
      // Filter out past slots to prevent users from selecting them
      const futureSlots = filterOutPastSlots(timeSlots)
      setSlots(futureSlots)
      
      // Update last refreshed time
      setLastRefreshed(new Date())
      
      console.log('🕐 Time slots:', {
        total: timeSlots.length,
        future: futureSlots.length,
        filtered: timeSlots.length - futureSlots.length
      })
    } catch (err) {
      console.error('Error fetching time slots:', err)
      const errorMessage = 'Failed to load time slots'
      
      // Determine error type
      let errorType: 'slot_unavailable' | 'insufficient_credits' | 'past_time' | 'conflict' | 'network' | 'generic' = 'network'
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorType = 'network'
        } else if (err.message.includes('unavailable')) {
          errorType = 'slot_unavailable'
        }
      }
      
      setError(errorMessage)
      setErrorType(errorType)
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    console.log('🔄 Refreshing time slots...')
    fetchTimeSlots(true)
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTimeOfDay = (timeString: string) => {
    const hour = parseInt(timeString.split(':')[0])
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    return 'Evening'
  }

  const groupSlotsByTimeOfDay = () => {
    const grouped: { [key: string]: TimeSlot[] } = {}
    
    slots.forEach(slot => {
      const timeOfDay = getTimeOfDay(slot.start_time)
      if (!grouped[timeOfDay]) {
        grouped[timeOfDay] = []
      }
      grouped[timeOfDay].push(slot)
    })
    
    return grouped
  }

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlot && 
           selectedSlot.date === slot.date && 
           selectedSlot.start_time === slot.start_time
  }

  const handleRetryFetch = () => {
    setShowErrorModal(false)
    setError(null)
    fetchTimeSlots()
  }

  const handleSelectNewDate = () => {
    setShowErrorModal(false)
    setError(null)
    // This would trigger parent to go back to date selection
    // For now, just retry the current date
    fetchTimeSlots()
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h4 className="font-medium text-red-900 mb-2">Failed to Load Time Slots</h4>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button onClick={fetchTimeSlots} variant="outline" className="border-red-300 text-red-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <Clock className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Loading Time Slots...</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (slots.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h4 className="font-medium text-orange-900 mb-2">No Available Slots</h4>
          <p className="text-sm text-orange-700 mb-4">
            No time slots are available for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}.
          </p>
          <div className="space-y-2 text-sm text-orange-600">
            <p>This could be because:</p>
            <ul className="text-left space-y-1 max-w-md mx-auto">
              <li>• All slots for this date are fully booked</li>
              <li>• The therapist is not available on this day</li>
              <li>• There was a temporary scheduling change</li>
            </ul>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchTimeSlots}
            className="mt-4 border-orange-300 text-orange-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Slots
          </Button>
        </CardContent>
      </Card>
    )
  }

  const groupedSlots = groupSlotsByTimeOfDay()

  return (
    <>
      {/* Error Modal */}
      <BookingErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorType={errorType}
        errorMessage={errorMessage}
        onRetry={handleRetryFetch}
        onSelectNewSlot={handleSelectNewDate}
      />

      <Card>
        <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold">
              Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedSlots).map(([timeOfDay, timeSlots]) => (
            <div key={timeOfDay} className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                {timeOfDay} ({timeSlots.length} slots)
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {timeSlots.map((slot) => {
                  const isSelected = isSlotSelected(slot)
                  
                  return (
                    <Button
                      key={`${slot.date}-${slot.start_time}`}
                      onClick={() => onSlotSelect(slot)}
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        h-20 flex flex-col items-center justify-center p-4 text-sm font-medium
                        transition-all duration-200 min-w-[120px]
                        ${isSelected 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="font-semibold text-base">
                        {formatTime(slot.start_time)}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatTime(slot.end_time)}
                      </div>
                      <div className="text-xs opacity-60 mt-1">
                        ({slot.session_duration || 60} mins)
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Total available slots: <strong className="text-blue-600">{slots.length}</strong></span>
              <span className="text-xs text-gray-500">
                Last updated: {lastRefreshed.toLocaleTimeString()} • Auto-refreshes every 30 seconds
              </span>
            </div>
            <span className="font-medium">Session duration: <strong className="text-blue-600">{slots[0]?.session_duration || 60} minutes</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
