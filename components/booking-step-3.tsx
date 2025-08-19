"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

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

interface BookingStep3Props {
  onNext: (selectedSlot: TimeSlot) => void
  onBack: () => void
  selectedTherapistId: string
}

export default function BookingStep3({ onNext, onBack, selectedTherapistId }: BookingStep3Props) {
  const [availability, setAvailability] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [therapistInfo, setTherapistInfo] = useState<any>(null)

  // Debug logging
  console.log('BookingStep3 props:', { onNext, onBack, selectedTherapistId })
  console.log('onNext type:', typeof onNext)
  console.log('Component render timestamp:', Date.now())

  // Safety check - don't render if props are missing
  if (!onNext || !onBack || !selectedTherapistId) {
    console.error('Missing required props:', { onNext: !!onNext, onBack: !!onBack, selectedTherapistId: !!selectedTherapistId })
    console.error('Full props object:', { onNext, onBack, selectedTherapistId })
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error: Missing required props</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
          <pre className="text-xs mt-2 text-left bg-gray-100 p-2 rounded">
            {JSON.stringify({ onNext: !!onNext, onBack: !!onBack, selectedTherapistId: !!selectedTherapistId }, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchTherapistAvailability()
  }, [selectedTherapistId])

  const fetchTherapistAvailability = async () => {
    try {
      // First get therapist info
      const therapistResponse = await fetch(`/api/therapists/${selectedTherapistId}`)
      const therapistData = await therapistResponse.json()
      
      if (therapistData.success) {
        setTherapistInfo(therapistData.therapist)
      }

      // Then get availability
      const availabilityResponse = await fetch(`/api/therapist/availability?therapistEmail=${therapistData.therapist.email}`)
      const availabilityData = await availabilityResponse.json()
      
      if (availabilityData.success) {
        console.log('Raw availability data:', availabilityData.availability)
        
        // Generate next 7 days based on weekly availability
        const generatedSlots: TimeSlot[] = []
        const today = new Date()
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(today)
          currentDate.setDate(today.getDate() + i)
          const dayOfWeek = currentDate.getDay()
          
          // Find matching weekly availability
          const weeklySlot = availabilityData.availability.find((slot: any) => 
            slot.day_of_week === dayOfWeek && slot.is_available
          )
          
          console.log(`Day ${i}: ${currentDate.toLocaleDateString()}, dayOfWeek: ${dayOfWeek}, found slot:`, weeklySlot)
          
          if (weeklySlot) {
            // Generate time slots for this day
            const startTime = new Date(`2000-01-01T${weeklySlot.start_time}`)
            const endTime = new Date(`2000-01-01T${weeklySlot.end_time}`)
            const sessionDuration = weeklySlot.session_duration || 60
            
            // Generate slots every session duration
            let currentSlotTime = new Date(startTime)
            while (currentSlotTime < endTime) {
              const slotEndTime = new Date(currentSlotTime.getTime() + sessionDuration * 60000)
              
              if (slotEndTime <= endTime) {
                generatedSlots.push({
                  id: `slot-${currentDate.toISOString().split('T')[0]}-${currentSlotTime.getHours()}-${currentSlotTime.getMinutes()}`,
                  date: currentDate.toISOString().split('T')[0],
                  day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                  start_time: currentSlotTime.toTimeString().slice(0, 5),
                  end_time: slotEndTime.toTimeString().slice(0, 5),
                  session_duration: sessionDuration,
                  session_title: "Individual Therapy Session",
                  session_type: 'individual',
                  is_available: true
                })
              }
              
              currentSlotTime = slotEndTime
            }
          }
        }
        
        console.log('Generated slots:', generatedSlots)
        setAvailability(generatedSlots)
      } else {
        console.log('Availability API returned error:', availabilityData)
        // Fallback: Generate sample availability for testing
        const sampleSlots: TimeSlot[] = []
        const today = new Date()
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(today)
          currentDate.setDate(today.getDate() + i)
          
          // Only show weekdays (Monday = 1, Friday = 5)
          if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
            sampleSlots.push({
              id: `sample-slot-${i}-1`,
              date: currentDate.toISOString().split('T')[0],
              day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
              start_time: "09:00",
              end_time: "10:00",
              session_duration: 60,
              session_title: "Individual Therapy Session",
              session_type: 'individual',
              is_available: true
            })
            
            sampleSlots.push({
              id: `sample-slot-${i}-2`,
              date: currentDate.toISOString().split('T')[0],
              day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
              start_time: "14:00",
              end_time: "15:00",
              session_duration: 60,
              session_title: "Individual Therapy Session",
              session_type: 'individual',
              is_available: true
            })
          }
        }
        
        console.log('Using sample slots:', sampleSlots)
        setAvailability(sampleSlots)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load therapist availability')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleContinue = () => {
    if (!selectedSlot) {
      toast.error('Please select an available time slot')
      return
    }
    
    if (typeof onNext !== 'function') {
      console.error('onNext is not a function:', onNext)
      toast.error('Error: Invalid function reference')
      return
    }
    
    try {
      onNext(selectedSlot)
    } catch (error) {
      console.error('Error calling onNext:', error)
      toast.error('Error proceeding to next step')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading available time slots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Select Available Time</h3>
        <p className="text-sm text-muted-foreground">
          Choose a convenient time slot for your session with {therapistInfo?.name || 'your therapist'}
        </p>
      </div>

      {/* Therapist Summary */}
      {therapistInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-lg">
                  {therapistInfo.name?.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">{therapistInfo.name}</h4>
                <p className="text-sm text-blue-700">{therapistInfo.specialization}</p>
              </div>
              <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-200">
                ₦{therapistInfo.hourly_rate?.toLocaleString() || '5,000'}/hr
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Slots */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Available Time Slots (Next 7 Days)
        </h4>

        {availability.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availability.map((slot) => (
              <Card
                key={slot.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedSlot?.id === slot.id
                    ? 'border-2 border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSlotSelect(slot)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {formatDate(slot.date)}
                        </span>
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {slot.session_duration} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {slot.session_type === 'individual' ? '1:1 Session' : 'Group Session'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2">
                      {slot.session_title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h4 className="font-medium text-orange-900 mb-2">No Available Slots</h4>
              <p className="text-sm text-orange-700">
                This therapist doesn't have any available time slots in the next 7 days. 
                Please check back later or contact support for assistance.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session Summary */}
      {selectedSlot && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Selected Session
            </h4>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Date:</strong> {formatDate(selectedSlot.date)}</p>
              <p><strong>Time:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
              <p><strong>Duration:</strong> {selectedSlot.session_duration} minutes</p>
              <p><strong>Type:</strong> {selectedSlot.session_type === 'individual' ? 'Individual Session' : 'Group Session'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}
