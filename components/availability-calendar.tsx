"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Save, 
  CheckCircle, 
  Calendar, 
  Plus, 
  X, 
  Settings,
  Video,
  Users,
  Clock3
} from "lucide-react"
import { toast } from "sonner"
import { useTherapistData } from "@/hooks/useTherapistDashboardState"

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  session_duration: number
  max_sessions: number
  session_title: string
  session_type: 'individual' | 'group'
  is_available: boolean
}

interface DayAvailability {
  date: string
  day_name: string
  day_of_week: number
  is_available: boolean
  time_slots: TimeSlot[]
  notes?: string
}

interface WeeklyAvailability {
  [date: string]: DayAvailability
}

const SESSION_TYPES = [
  { value: 'individual', label: 'Individual Session', icon: Users },
  { value: 'group', label: 'Group Session', icon: Users }
]

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

export function AvailabilityCalendar() {
  const { therapistInfo } = useTherapistData()
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Generate next 7 days
  const generateNext7Days = () => {
    const days: { date: string; day_name: string; day_of_week: number }[] = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      days.push({
        date: date.toISOString().split('T')[0],
        day_name: date.toLocaleDateString('en-US', { weekday: 'long' }),
        day_of_week: date.getDay()
      })
    }
    
    return days
  }

  useEffect(() => {
    initializeWeeklyAvailability()
  }, [])

  const initializeWeeklyAvailability = () => {
    const days = generateNext7Days()
    const initialAvailability: WeeklyAvailability = {}
    
    days.forEach(day => {
      const isWeekday = day.day_of_week >= 1 && day.day_of_week <= 5
      initialAvailability[day.date] = {
        date: day.date,
        day_name: day.day_name,
        day_of_week: day.day_of_week,
        is_available: isWeekday,
        time_slots: isWeekday ? [
          {
            id: `slot-${day.date}-1`,
            start_time: "09:00",
            end_time: "10:00",
            session_duration: 60,
            max_sessions: 1,
            session_title: "Individual Therapy Session",
            session_type: 'individual',
            is_available: true
          },
          {
            id: `slot-${day.date}-2`,
            start_time: "10:30",
            end_time: "11:30",
            session_duration: 60,
            max_sessions: 1,
            session_title: "Individual Therapy Session",
            session_type: 'individual',
            is_available: true
          },
          {
            id: `slot-${day.date}-3`,
            start_time: "14:00",
            end_time: "15:00",
            session_duration: 60,
            max_sessions: 1,
            session_title: "Individual Therapy Session",
            session_type: 'individual',
            is_available: true
          }
        ] : []
      }
    })
    
    setWeeklyAvailability(initialAvailability)
    setLoading(false)
  }

  const handleToggleDay = (date: string, checked: boolean) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        is_available: checked,
        time_slots: checked ? prev[date].time_slots : []
      }
    }))
  }

  const handleAddTimeSlot = (date: string) => {
    const newSlot: TimeSlot = {
      id: `slot-${date}-${Date.now()}`,
      start_time: "09:00",
      end_time: "10:00",
      session_duration: 60,
      max_sessions: 1,
      session_title: "Individual Therapy Session",
      session_type: 'individual',
      is_available: true
    }

    setWeeklyAvailability(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        time_slots: [...prev[date].time_slots, newSlot]
      }
    }))
  }

  const handleRemoveTimeSlot = (date: string, slotId: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        time_slots: prev[date].time_slots.filter(slot => slot.id !== slotId)
      }
    }))
  }

  const handleUpdateTimeSlot = (date: string, slotId: string, updates: Partial<TimeSlot>) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        time_slots: prev[date].time_slots.map(slot => 
          slot.id === slotId ? { ...slot, ...updates } : slot
        )
      }
    }))
  }

  const handleSave = async () => {
    if (!therapistInfo?.email) {
      toast.error('Therapist email not found. Please refresh the page.')
      return
    }

    setSaving(true)
    try {
      // Convert weekly availability to the format expected by the API
      const availabilityData = Object.values(weeklyAvailability)
        .filter(day => day.is_available)
        .map(day => ({
          date: day.date,
          day_name: day.day_name,
          day_of_week: day.day_of_week,
          time_slots: day.time_slots.filter(slot => slot.is_available)
        }))

      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistEmail: therapistInfo.email,
          availability: availabilityData,
          weeklySchedule: weeklyAvailability
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

  const getDayCardClass = (date: string) => {
    const day = weeklyAvailability[date]
    if (!day) return ""
    
    const baseClass = "relative p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
    
    if (day.is_available && day.time_slots.length > 0) {
      return `${baseClass} border-green-200 bg-green-50 hover:bg-green-100`
    } else if (day.is_available) {
      return `${baseClass} border-blue-200 bg-blue-50 hover:bg-blue-100`
    } else {
      return `${baseClass} border-gray-200 bg-gray-50 hover:bg-gray-100`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading calendar...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">7-Day Availability Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Set your availability for the next 7 days with custom time slots
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {Object.entries(weeklyAvailability).map(([date, day]) => (
          <Card key={date} className={getDayCardClass(date)}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{day.day_name}</h4>
                    <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
                  </div>
                  <Switch
                    checked={day.is_available}
                    onCheckedChange={(checked) => handleToggleDay(date, checked)}
                    size="sm"
                  />
                </div>

                {/* Availability Status */}
                {day.is_available ? (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      <Clock3 className="h-3 w-3 mr-1" />
                      {day.time_slots.length} slot{day.time_slots.length !== 1 ? 's' : ''}
                    </Badge>
                    
                    {/* Time Slots Preview */}
                    {day.time_slots.slice(0, 2).map(slot => (
                      <div key={slot.id} className="text-xs text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    ))}
                    
                    {day.time_slots.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.time_slots.length - 2} more
                      </div>
                    )}

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedDate(date)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Edit Slots
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Not available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && weeklyAvailability[selectedDate]?.day_name} - {selectedDate && formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              {/* Add New Time Slot */}
              <Button
                onClick={() => handleAddTimeSlot(selectedDate)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>

              {/* Time Slots */}
              <div className="space-y-3">
                {weeklyAvailability[selectedDate].time_slots.map((slot, index) => (
                  <Card key={slot.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Slot {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeSlot(selectedDate, slot.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { start_time: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { end_time: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Session Duration</Label>
                          <Select
                            value={slot.session_duration.toString()}
                            onValueChange={(value) => handleUpdateTimeSlot(selectedDate, slot.id, { session_duration: parseInt(value) })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_DURATIONS.map(duration => (
                                <SelectItem key={duration.value} value={duration.value.toString()}>
                                  {duration.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Max Sessions</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={slot.max_sessions}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { max_sessions: parseInt(e.target.value) })}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Session Title</Label>
                        <Input
                          value={slot.session_title}
                          onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { session_title: e.target.value })}
                          placeholder="e.g., Individual Therapy Session"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Session Type</Label>
                        <Select
                          value={slot.session_type}
                          onValueChange={(value: 'individual' | 'group') => handleUpdateTimeSlot(selectedDate, slot.id, { session_type: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-3 w-3" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={(checked) => handleUpdateTimeSlot(selectedDate, slot.id, { is_available: checked })}
                        />
                        <Label className="text-xs">Available for booking</Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {weeklyAvailability[selectedDate].time_slots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No time slots added yet</p>
                  <p className="text-sm">Click "Add Time Slot" to get started</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Calendar Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click on any day to set custom time slots</li>
          <li>• Each time slot can have different session types and durations</li>
          <li>• Session titles will be automatically used for Daily.co room creation</li>
          <li>• You can set different availability for each day of the week</li>
          <li>• Changes are saved automatically when you click "Save Schedule"</li>
        </ul>
      </div>
    </div>
  )
}
