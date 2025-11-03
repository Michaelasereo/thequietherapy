'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AvailabilityService, TimeSlot } from '@/lib/services/availabilityService'

interface ScheduleNextSessionModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
  therapistId: string
  currentSessionId: string
  onSessionScheduled?: (sessionId: string) => void
}

export default function ScheduleNextSessionModal({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName,
  therapistId,
  currentSessionId,
  onSessionScheduled
}: ScheduleNextSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newSessionId, setNewSessionId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'confirm'>('date')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '30',
    notes: ''
  })

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isDatePast = (date: Date) => {
    const today = new Date()
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return dateLocal < todayLocal
  }

  const isDateBeyondLimit = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Therapists can schedule up to 21 days in advance
    const twentyOneDaysFromNow = new Date(today)
    twentyOneDaysFromNow.setDate(today.getDate() + 21)
    
    return date > twentyOneDaysFromNow
  }

  const isDateToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isDateSelected = (date: Date) => {
    return formData.date === formatDateForAPI(date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || isDateBeyondLimit(date)) return
    
    const dateStr = formatDateForAPI(date)
    setFormData({ ...formData, date: dateStr })
    setCurrentStep('time')
  }

  // Fetch available time slots when a date is selected
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.date || !therapistId) {
        setTimeSlots([])
        return
      }

      setLoadingSlots(true)
      try {
        const slots = await AvailabilityService.getTimeSlots(therapistId, formData.date)
        setTimeSlots(slots)
        console.log('✅ Fetched available time slots:', slots.length)
      } catch (error) {
        console.error('Error fetching time slots:', error)
        setTimeSlots([])
        toast.error('Failed to load available time slots')
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [formData.date, therapistId])

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
      const isCurrentMonth = currentDate.getMonth() === month
      const isSelected = isDateSelected(currentDate)
      const isToday = isDateToday(currentDate)
      const isPast = isDatePast(currentDate)
      const isBeyondLimit = isDateBeyondLimit(currentDate)
      const isAvailable = !isPast && !isBeyondLimit
      const dayNumber = currentDate.getDate()
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateClick(currentDate)}
          disabled={isPast || isBeyondLimit}
          className={`
            relative h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
            ${!isCurrentMonth ? 'text-gray-300' : ''}
            ${isPast || isBeyondLimit ? 'text-gray-300 cursor-not-allowed' : ''}
            ${isAvailable && isCurrentMonth ? 'hover:bg-gray-100 cursor-pointer' : ''}
            ${isSelected ? 'bg-black text-white hover:bg-gray-800' : ''}
            ${isToday && !isSelected ? 'ring-2 ring-gray-300' : ''}
          `}
        >
          {dayNumber}
          {isToday && !isSelected && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-gold rounded-full"></div>
          )}
        </button>
      )
    }
    
    return days
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.date || !formData.time) {
      toast.error('Please select both date and time')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/therapist/schedule-next-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId,
          patientId,
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          durationMinutes: parseInt(formData.duration),
          notes: formData.notes,
          previousSessionId: currentSessionId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        setNewSessionId(result.sessionId)
        toast.success('Next session scheduled successfully!')
        
        if (onSessionScheduled) {
          onSessionScheduled(result.sessionId)
        }

        // Auto-close after 2 seconds
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        toast.error(result.error || 'Failed to schedule session')
      }
    } catch (error) {
      console.error('Error scheduling next session:', error)
      toast.error('Failed to schedule next session')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSuccess(false)
      setNewSessionId(null)
      setCurrentStep('date')
      setFormData({
        date: '',
        time: '',
        duration: '30',
        notes: ''
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Schedule Next Session
          </DialogTitle>
          <DialogDescription>
            Schedule a follow-up session with {patientName}
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`flex items-center gap-2 ${currentStep === 'date' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'date' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm">Date</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${currentStep === 'time' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'time' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm">Time</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirm' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="text-sm">Confirm</span>
              </div>
            </div>

            {/* Patient Info */}
            <Card className="bg-gray-50 border-gray-300">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-900" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduling for</p>
                    <p className="font-medium">{patientName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: Date Selection with Calendar */}
            {currentStep === 'date' && (
              <Card>
                <CardContent className="pt-6">
                  <Alert className="mb-4 border-brand-gold bg-brand-gold/10">
                    <AlertCircle className="h-4 w-4 text-brand-gold" />
                    <AlertDescription className="text-gray-900 text-sm">
                      <strong>Therapist Scheduling:</strong> You can schedule sessions up to 21 days in advance, 
                      regardless of your regular availability settings.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="font-semibold text-lg">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="space-y-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendarDays()}
                    </div>
                  </div>

                  {formData.date && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Selected:</strong> {new Date(formData.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Time Selection */}
            {currentStep === 'time' && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Select Time</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep('date')}
                    >
                      Change Date
                    </Button>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg mb-4">
                    <p className="text-sm text-gray-900">
                      <strong>Date:</strong> {new Date(formData.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {/* Loading State */}
                  {loadingSlots && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
                      <p className="text-sm text-muted-foreground">Loading available times...</p>
                    </div>
                  )}

                  {/* Time Slots Grid */}
                  {!loadingSlots && timeSlots.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2">
                      {timeSlots.map(slot => {
                        const formatTime = (timeString: string) => {
                          const [hours, minutes] = timeString.split(':')
                          const hour = parseInt(hours)
                          const ampm = hour >= 12 ? 'PM' : 'AM'
                          const displayHour = hour % 12 || 12
                          return `${displayHour}:${minutes} ${ampm}`
                        }

                        return (
                          <button
                            key={`${slot.start_time}-${slot.end_time}`}
                            onClick={() => {
                              setFormData({ ...formData, time: slot.start_time })
                              setCurrentStep('confirm')
                            }}
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                              ${formData.time === slot.start_time 
                                ? 'bg-black text-white border-black' 
                                : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                              }
                            `}
                          >
                            <Clock className="h-4 w-4 mx-auto mb-1" />
                            {formatTime(slot.start_time)}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* No Slots Available */}
                  {!loadingSlots && timeSlots.length === 0 && (
                    <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 mb-1">No Available Times</p>
                      <p className="text-xs text-muted-foreground">
                        No time slots are available for this date.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 'confirm' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Confirm Details</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep('time')}
                      >
                        Edit
                      </Button>
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-900" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {new Date(formData.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-gray-900" />
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="font-medium">{formData.time}</p>
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: '30', label: '30 min' },
                          { value: '45', label: '45 min' },
                          { value: '60', label: '1 hour' },
                          { value: '90', label: '1.5 hours' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, duration: option.value })}
                            className={`
                              p-2 rounded-lg border-2 transition-all text-sm font-medium
                              ${formData.duration === option.value 
                                ? 'bg-black text-white border-black' 
                                : 'bg-white border-gray-200 hover:border-gray-400'
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Session Focus (Optional)</Label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="What will you work on in the next session?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Alert className="border-brand-gold bg-brand-gold/10">
                  <AlertCircle className="h-4 w-4 text-brand-gold" />
                  <AlertDescription className="text-gray-900 text-sm">
                    <strong>Note:</strong> This session will appear on the patient's dashboard. 
                    The patient will need to have available credits to join this session.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black hover:bg-gray-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm & Schedule
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session Scheduled!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                The next session with {patientName} has been scheduled successfully.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-900" />
                <span className="text-sm font-medium text-gray-900">
                  {formData.date && new Date(formData.date).toLocaleDateString()} at {formData.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Closing automatically...
              </p>
            </div>
          )}
      </DialogContent>
    </Dialog>
  )
}

