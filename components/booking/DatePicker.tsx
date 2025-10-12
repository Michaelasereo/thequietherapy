"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, AlertTriangle } from "lucide-react"
import { AvailabilityService } from "@/lib/services/availabilityService"

interface DatePickerProps {
  therapistId: string
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export default function DatePicker({ therapistId, onDateSelect, selectedDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  useEffect(() => {
    fetchAvailableDates()
  }, [currentMonth, therapistId])

  const fetchAvailableDates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      
      const dates = await AvailabilityService.getAvailableDays(therapistId, month, year)
      setAvailableDates(dates)
    } catch (err) {
      console.error('Error fetching available dates:', err)
      setError('Failed to load available dates')
      setAvailableDates([]) // Empty array if API fails
    } finally {
      setLoading(false)
    }
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

  const formatDateForAPI = (date: Date) => {
    // Use local timezone to avoid date shifting issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const result = `${year}-${month}-${day}`
    return result
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDateForAPI(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Only disable past dates
    const isPast = date < today
    
    // Limit patient booking to 7 days in the future
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)
    const isBeyond7Days = date > sevenDaysFromNow
    
    // Check if this date is in the therapist's disabled dates (from API)
    // If availableDates is empty, allow all future dates within 7-day window
    const isDisabledByTherapist = availableDates.length > 0 && !availableDates.includes(dateStr)
    
    return !isPast && !isBeyond7Days && !isDisabledByTherapist
  }

  const isDateSelected = (date: Date) => {
    const dateStr = formatDateForAPI(date)
    return selectedDate === dateStr
  }

  const isDateToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isDatePast = (date: Date) => {
    const today = new Date()
    
    // Create date objects for comparison in local timezone
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    return dateLocal < todayLocal
  }

  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || !isDateAvailable(date)) {
      return
    }
    
    const dateStr = formatDateForAPI(date)
    onDateSelect(dateStr)
  }

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const days = []
    
    // Render 6 weeks (42 days) to ensure full month coverage
    for (let i = 0; i < 42; i++) {
      // Create a new Date object for each iteration to avoid mutation issues
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
      
      const isCurrentMonth = currentDate.getMonth() === month
      const isAvailable = isDateAvailable(currentDate)
      const isSelected = isDateSelected(currentDate)
      const isToday = isDateToday(currentDate)
      const isPast = isDatePast(currentDate)
      
      const dateStr = formatDateForAPI(currentDate)
      const dayNumber = currentDate.getDate()
      
      days.push(
        <button
          key={dateStr}
          onClick={() => handleDateClick(new Date(currentDate))}
          disabled={!isAvailable}
          className={`
            relative h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
            ${!isCurrentMonth ? 'text-gray-400' : ''}
            ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
            ${isAvailable && !isPast && isCurrentMonth ? 'hover:bg-gray-100 cursor-pointer' : ''}
            ${isSelected ? 'bg-black text-white hover:bg-gray-800' : ''}
            ${!isAvailable && !isPast && isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
            ${isToday && !isSelected ? 'ring-2 ring-gray-300' : ''}
          `}
          title={
            isPast ? 'Past date' : 
            isAvailable ? `Click to select ${dateStr}` : 
            'Not available'
          }
        >
          {dayNumber}
        </button>
      )
    }
    
    return days
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h4 className="font-medium text-red-900 mb-2">Failed to Load Calendar</h4>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button onClick={fetchAvailableDates} variant="outline" className="border-red-300 text-red-700">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-900" />
            <h3 className="text-lg font-semibold">Select a Date</h3>
          </div>
        </div>
        
        {/* Availability Info */}
        <Alert className="mb-4 border-brand-gold bg-brand-gold/10">
          <AlertCircle className="h-4 w-4 text-brand-gold" />
          <AlertDescription className="text-gray-900 text-sm">
            <strong>Booking Window:</strong> You can book sessions up to 7 days in advance.
          </AlertDescription>
        </Alert>
        
        {!loading && availableDates.length === 0 && !error && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Limited Availability:</strong> This therapist hasn't configured their availability calendar yet. 
              Please contact support or try another therapist.
            </AlertDescription>
          </Alert>
        )}
        
        {availableDates.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>✓ {availableDates.length} days available</strong> this month. Click a highlighted date to see available time slots.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium min-w-[140px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <span>Past/Disabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
