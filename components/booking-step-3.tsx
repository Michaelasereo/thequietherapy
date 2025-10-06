"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import ProgressiveBookingStep3 from "./booking/ProgressiveBookingStep3"
import TestDateSelection from "./booking/TestDateSelection"

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
  booking_status?: 'available' | 'booked'
}

interface BookingStep3Props {
  onNext: (selectedSlot: TimeSlot) => void
  onBack: () => void
  selectedTherapistId: string
  selectedTherapistData?: any
}

export default function BookingStep3({ onNext, onBack, selectedTherapistId, selectedTherapistData }: BookingStep3Props) {
  // Use ProgressiveBookingStep3 with enhanced debugging
  return (
    <div className="space-y-6">
      <ProgressiveBookingStep3
        onNext={onNext}
        onBack={onBack}
        selectedTherapistId={selectedTherapistId}
        selectedTherapistData={selectedTherapistData}
      />
    </div>
  )
}
