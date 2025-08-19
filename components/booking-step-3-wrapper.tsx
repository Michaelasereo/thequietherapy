"use client"

import { useState } from "react"
import BookingStep3 from "./booking-step-3"

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

interface BookingStep3WrapperProps {
  selectedTherapistId: string
  onBack: () => void
  onComplete: (slot: TimeSlot) => void
}

export default function BookingStep3Wrapper({ selectedTherapistId, onBack, onComplete }: BookingStep3WrapperProps) {
  const [testSlot] = useState<TimeSlot>({
    id: 'test-slot',
    date: '2024-01-01',
    day_name: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    session_duration: 60,
    session_title: 'Test Session',
    session_type: 'individual',
    is_available: true
  })

  const handleNext = (slot: TimeSlot) => {
    console.log('Wrapper handleNext called with slot:', slot)
    onComplete(slot)
  }

  console.log('Wrapper props:', { selectedTherapistId, onBack, onComplete })
  console.log('Wrapper handleNext function:', handleNext)
  console.log('Wrapper handleNext type:', typeof handleNext)

  return (
    <div>
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
        <h4 className="font-bold text-yellow-800">Debug Info:</h4>
        <p>selectedTherapistId: {selectedTherapistId}</p>
        <p>onBack type: {typeof onBack}</p>
        <p>onComplete type: {typeof onComplete}</p>
        <p>handleNext type: {typeof handleNext}</p>
        <button 
          onClick={() => handleNext(testSlot)}
          className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
        >
          Test Function Call
        </button>
      </div>
      
      <BookingStep3
        onNext={handleNext}
        onBack={onBack}
        selectedTherapistId={selectedTherapistId}
      />
    </div>
  )
}
