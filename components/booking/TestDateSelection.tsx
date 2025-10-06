"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TestDateSelection() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<'date' | 'time'>('date')

  const handleDateClick = (date: string) => {
    console.log('🗓️ Test: Date clicked:', date)
    setSelectedDate(date)
    setCurrentStep('time')
    console.log('🗓️ Test: Step changed to time')
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Test Date Selection</h3>
      
      <div className="space-y-2">
        <p>Current Step: <strong>{currentStep}</strong></p>
        <p>Selected Date: <strong>{selectedDate || 'None'}</strong></p>
      </div>

      {currentStep === 'date' && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Click a date to test:</h4>
            <div className="grid grid-cols-7 gap-2">
              {['2025-09-14', '2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18'].map((date) => (
                <Button
                  key={date}
                  variant="outline"
                  onClick={() => handleDateClick(date)}
                  className="h-12"
                >
                  {new Date(date).getDate()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'time' && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Time selection step</h4>
            <p>Selected date: {selectedDate}</p>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('date')}
              className="mt-4"
            >
              Back to Date Selection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
