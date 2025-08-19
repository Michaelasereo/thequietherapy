"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Save, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useTherapistData } from "@/hooks/useTherapistDashboardState"

interface AvailabilitySlot {
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  is_available: boolean
  session_duration: number
  max_sessions_per_day: number
}

const DAYS_OF_WEEK = [
  { value: 0, name: "Sunday" },
  { value: 1, name: "Monday" },
  { value: 2, name: "Tuesday" },
  { value: 3, name: "Wednesday" },
  { value: 4, name: "Thursday" },
  { value: 5, name: "Friday" },
  { value: 6, name: "Saturday" }
]

export function AvailabilitySchedule() {
  const { therapistInfo } = useTherapistData()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Initialize availability slots
    const initialSlots = DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      day_name: day.name,
      start_time: "09:00",
      end_time: "17:00",
      is_available: day.value >= 1 && day.value <= 5, // Monday to Friday by default
      session_duration: 60,
      max_sessions_per_day: 8
    }))
    setAvailability(initialSlots)
    setLoading(false)
  }, [])

  const handleToggleDay = (dayOfWeek: number, checked: boolean) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayOfWeek 
          ? { ...slot, is_available: checked }
          : slot
      )
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayOfWeek 
          ? { ...slot, [field]: value }
          : slot
      )
    )
  }

  const handleSave = async () => {
    if (!therapistInfo?.email) {
      toast.error('Therapist email not found. Please refresh the page.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistEmail: therapistInfo.email,
          availability: availability.filter(slot => slot.is_available)
        }),
      })

      if (response.ok) {
        toast.success('Availability schedule saved successfully')
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save availability schedule')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability schedule')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading availability schedule...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Set Your Weekly Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Configure your availability for each day of the week
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving || !therapistInfo?.email}
          className="flex items-center gap-2"
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Schedule
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {availability.map((slot) => (
          <Card key={slot.day_of_week} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={slot.is_available}
                    onCheckedChange={(checked) => handleToggleDay(slot.day_of_week, checked)}
                  />
                  <Label className="text-base font-medium min-w-[100px]">
                    {slot.day_name}
                  </Label>
                </div>

                {slot.is_available && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'start_time', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'end_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                {!slot.is_available && (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Tips for Setting Availability</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set realistic hours that you can consistently maintain</li>
          <li>• Consider your timezone and client timezones</li>
          <li>• Leave buffer time between sessions for breaks</li>
          <li>• You can update your schedule anytime</li>
        </ul>
      </div>
    </div>
  )
}
