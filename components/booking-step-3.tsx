"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import ProgressiveBookingStep3 from "./booking/ProgressiveBookingStep3"
import TestDateSelection from "./booking/TestDateSelection"
import { TimeSlot } from "@/lib/services/availabilityService"

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
