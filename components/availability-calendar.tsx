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
  Clock3,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Zap
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
  { value: 'individual', label: 'Individual Session', icon: Users, color: 'bg-blue-100 text-blue-800' },
  { value: 'group', label: 'Group Session', icon: Users, color: 'bg-purple-100 text-purple-800' }
]

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes', icon: Coffee },
  { value: 45, label: '45 minutes', icon: Clock },
  { value: 60, label: '1 hour', icon: Clock3 },
  { value: 90, label: '1.5 hours', icon: Zap },
  { value: 120, label: '2 hours', icon: Moon }
]

const DAY_ICONS = {
  0: Sun, // Sunday
  1: Moon, // Monday
  2: Moon, // Tuesday
  3: Moon, // Wednesday
  4: Moon, // Thursday
  5: Moon, // Friday
  6: Sun, // Saturday
}

export function AvailabilityCalendar() {
  const { therapistInfo } = useTherapistData()
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Generate next 7 days with week navigation
  const generateWeekDays = (offset: number = 0) => {
    const days: { date: string; day_name: string; day_of_week: number }[] = []
    const today = new Date()
    today.setDate(today.getDate() + (offset * 7))
    
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
  }, [currentWeekOffset])

  const initializeWeeklyAvailability = () => {
    const days = generateWeekDays(currentWeekOffset)
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
    
    const baseClass = "relative p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105 transform"
    
    if (day.is_available && day.time_slots.length > 0) {
      return `${baseClass} border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100`
    } else if (day.is_available) {
      return `${baseClass} border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100`
    } else {
      return `${baseClass} border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getWeekRange = () => {
    const days = generateWeekDays(currentWeekOffset)
    const startDate = new Date(days[0].date)
    const endDate = new Date(days[6].date)
    
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const weekRange = getWeekRange()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weekly Availability Calendar
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set your availability for the next 7 days with custom time slots
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-white rounded-lg border p-2 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {weekRange.start} - {weekRange.end}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || !therapistInfo?.email}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
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
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {Object.entries(weeklyAvailability).map(([date, day]) => {
          const DayIcon = DAY_ICONS[day.day_of_week as keyof typeof DAY_ICONS] || Calendar
          return (
            <Card key={date} className={getDayCardClass(date)}>
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DayIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold text-sm">{day.day_name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
                      </div>
                    </div>
                    <Switch
                      checked={day.is_available}
                      onCheckedChange={(checked) => handleToggleDay(date, checked)}
                      size="sm"
                    />
                  </div>

                  {/* Availability Status */}
                  {day.is_available ? (
                    <div className="space-y-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          day.time_slots.length > 0 
                            ? 'border-green-300 text-green-700 bg-green-50' 
                            : 'border-blue-300 text-blue-700 bg-blue-50'
                        }`}
                      >
                        <Clock3 className="h-3 w-3 mr-1" />
                        {day.time_slots.length} slot{day.time_slots.length !== 1 ? 's' : ''}
                      </Badge>
                      
                      {/* Time Slots Preview */}
                      <div className="space-y-1">
                        {day.time_slots.slice(0, 2).map(slot => (
                          <div key={slot.id} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {slot.start_time} - {slot.end_time}
                            <Badge 
                              variant="outline" 
                              className={`ml-auto text-xs ${
                                slot.session_type === 'individual' 
                                  ? 'border-blue-300 text-blue-700 bg-blue-50' 
                                  : 'border-purple-300 text-purple-700 bg-purple-50'
                              }`}
                            >
                              {slot.session_type === 'individual' ? '1:1' : 'Group'}
                            </Badge>
                          </div>
                        ))}
                        
                        {day.time_slots.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center py-1 bg-gray-50 rounded">
                            +{day.time_slots.length - 2} more slots
                          </div>
                        )}
                      </div>

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs hover:bg-white/50"
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
                    <div className="text-center py-4">
                      <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
                        <X className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                        Not available
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDate && weeklyAvailability[selectedDate]?.day_name} - {selectedDate && formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-6">
              {/* Add New Time Slot */}
              <Button
                onClick={() => handleAddTimeSlot(selectedDate)}
                variant="outline"
                className="w-full h-12 text-lg hover:bg-blue-50 hover:border-blue-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Time Slot
              </Button>

              {/* Time Slots */}
              <div className="space-y-4">
                {weeklyAvailability[selectedDate].time_slots.map((slot, index) => (
                  <Card key={slot.id} className="p-6 border-2 hover:border-blue-300 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-lg">Time Slot {index + 1}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeSlot(selectedDate, slot.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { start_time: e.target.value })}
                            className="text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">End Time</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { end_time: e.target.value })}
                            className="text-sm mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Session Duration</Label>
                          <Select
                            value={slot.session_duration.toString()}
                            onValueChange={(value) => handleUpdateTimeSlot(selectedDate, slot.id, { session_duration: parseInt(value) })}
                          >
                            <SelectTrigger className="text-sm mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_DURATIONS.map(duration => (
                                <SelectItem key={duration.value} value={duration.value.toString()}>
                                  <div className="flex items-center gap-2">
                                    <duration.icon className="h-4 w-4" />
                                    {duration.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Max Sessions</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={slot.max_sessions}
                            onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { max_sessions: parseInt(e.target.value) })}
                            className="text-sm mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Session Title</Label>
                        <Input
                          value={slot.session_title}
                          onChange={(e) => handleUpdateTimeSlot(selectedDate, slot.id, { session_title: e.target.value })}
                          placeholder="e.g., Individual Therapy Session"
                          className="text-sm mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Session Type</Label>
                        <Select
                          value={slot.session_type}
                          onValueChange={(value: 'individual' | 'group') => handleUpdateTimeSlot(selectedDate, slot.id, { session_type: value })}
                        >
                          <SelectTrigger className="text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={(checked) => handleUpdateTimeSlot(selectedDate, slot.id, { is_available: checked })}
                        />
                        <Label className="text-sm">Available for booking</Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {weeklyAvailability[selectedDate].time_slots.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No time slots added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add New Time Slot" to get started</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Calendar Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Click on any day to set custom time slots</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Each time slot can have different session types and durations</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Session titles will be automatically used for Daily.co room creation</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Use the week navigation to plan ahead</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Changes are saved automatically when you click "Save Schedule"</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
