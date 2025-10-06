"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Save, CheckCircle, Settings } from "lucide-react"
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
    loadExistingTemplates()
  }, [therapistInfo])

  const loadExistingTemplates = async () => {
    console.log('🔄 Loading existing templates for therapist:', therapistInfo?.id)
    
    if (!therapistInfo?.id) {
      console.log('⚠️ No therapist ID available, using default slots')
      // Initialize with default slots if no therapist info
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
      return
    }

    try {
      console.log('📡 Fetching templates from API...')
      const response = await fetch(`/api/therapist/availability/template?therapist_id=${therapistInfo.id}`)
      console.log('📡 API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📡 API response data:', data)
        const templates = data.templates || []
        console.log('📡 Found templates:', templates.length)
        
        // Create availability slots from templates
        const templateSlots = DAYS_OF_WEEK.map(day => {
          const template = templates.find((t: any) => t.day_of_week === day.value)
          console.log(`📅 Day ${day.name} (${day.value}):`, template ? 'Has template' : 'No template')
          return {
            day_of_week: day.value,
            day_name: day.name,
            start_time: template?.start_time || "09:00",
            end_time: template?.end_time || "17:00",
            is_available: !!template,
            session_duration: template?.session_duration || 60,
            max_sessions_per_day: template?.max_sessions || 8
          }
        })
        
        console.log('📅 Final template slots:', templateSlots)
        setAvailability(templateSlots)
      } else {
        console.error('❌ API error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API error data:', errorData)
        
        // Fallback to default slots
        const initialSlots = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          day_name: day.name,
          start_time: "09:00",
          end_time: "17:00",
          is_available: day.value >= 1 && day.value <= 5,
          session_duration: 60,
          max_sessions_per_day: 8
        }))
        setAvailability(initialSlots)
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error)
      // Fallback to default slots
      const initialSlots = DAYS_OF_WEEK.map(day => ({
        day_of_week: day.value,
        day_name: day.name,
        start_time: "09:00",
        end_time: "17:00",
        is_available: day.value >= 1 && day.value <= 5,
        session_duration: 60,
        max_sessions_per_day: 8
      }))
      setAvailability(initialSlots)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number, checked: boolean) => {
    setSaved(false) // Reset saved state when making changes
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayOfWeek 
          ? { ...slot, is_available: checked }
          : slot
      )
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setSaved(false) // Reset saved state when making changes
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayOfWeek 
          ? { ...slot, [field]: value }
          : slot
      )
    )
  }

  const handleSave = async () => {
    console.log('💾 Starting save process...')
    console.log('💾 Therapist ID:', therapistInfo?.id)
    console.log('💾 Current availability:', availability)
    
    if (!therapistInfo?.id) {
      console.error('❌ No therapist ID available')
      toast.error('Therapist ID not found. Please refresh the page.')
      return
    }

    setSaving(true)
    try {
      // Transform data for the new template API
      const templateData = availability
        .filter(slot => slot.is_available)
        .map(slot => ({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          session_duration: slot.session_duration,
          session_type: 'individual',
          max_sessions: slot.max_sessions_per_day
        }))

      console.log('💾 Template data to save:', templateData)

      const response = await fetch('/api/therapist/availability/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapist_id: therapistInfo.id,
          templates: templateData
        }),
      })

      console.log('💾 Save response status:', response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ Save successful:', responseData)
        toast.success('Weekly schedule saved successfully')
        setSaved(true)
        
        // Reload templates to ensure UI is in sync
        setTimeout(() => {
          loadExistingTemplates()
        }, 1000)
      } else {
        const errorData = await response.json()
        console.error('❌ Save failed:', errorData)
        toast.error(errorData.error || 'Failed to save weekly schedule')
      }
    } catch (error) {
      console.error('❌ Error saving weekly schedule:', error)
      toast.error('Failed to save weekly schedule')
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
              <Settings className="h-4 w-4" />
              Edit Availability
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
