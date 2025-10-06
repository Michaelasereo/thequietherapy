"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Calendar, 
  Plus, 
  X, 
  Clock, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Coffee,
  Moon,
  Sun
} from "lucide-react"
import { toast } from "sonner"
import { useTherapistData } from "@/hooks/useTherapistDashboardState"

interface AvailabilityOverride {
  id?: string
  override_date: string
  is_available: boolean
  start_time?: string
  end_time?: string
  session_duration?: number
  session_type?: string
  max_sessions?: number
  reason?: string
  created_at?: string
}

const REASON_OPTIONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick_day', label: 'Sick Day' },
  { value: 'training', label: 'Training' },
  { value: 'conference', label: 'Conference' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' }
]

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes', icon: Coffee },
  { value: 45, label: '45 minutes', icon: Clock },
  { value: 60, label: '1 hour', icon: Clock },
  { value: 90, label: '1.5 hours', icon: Moon },
  { value: 120, label: '2 hours', icon: Sun }
]

export function AvailabilityOverrides() {
  const { therapistInfo } = useTherapistData()
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Form state for new/edit override
  const [formData, setFormData] = useState<AvailabilityOverride>({
    override_date: '',
    is_available: false,
    start_time: '09:00',
    end_time: '17:00',
    session_duration: 60,
    session_type: 'individual',
    max_sessions: 1,
    reason: ''
  })

  useEffect(() => {
    if (therapistInfo?.id) {
      loadOverrides()
    }
  }, [therapistInfo, currentMonth])

  const loadOverrides = async () => {
    if (!therapistInfo?.id) return

    try {
      setLoading(true)
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/therapist/availability/override?therapist_id=${therapistInfo.id}&start_date=${startOfMonth.toISOString().split('T')[0]}&end_date=${endOfMonth.toISOString().split('T')[0]}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setOverrides(data.overrides || [])
      }
    } catch (error) {
      console.error('Error loading overrides:', error)
      toast.error('Failed to load availability overrides')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOverride = (date: string) => {
    setSelectedDate(date)
    setFormData({
      override_date: date,
      is_available: false,
      start_time: '09:00',
      end_time: '17:00',
      session_duration: 60,
      session_type: 'individual',
      max_sessions: 1,
      reason: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditOverride = (override: AvailabilityOverride) => {
    setSelectedDate(override.override_date)
    setFormData(override)
    setIsDialogOpen(true)
  }

  const handleSaveOverride = async () => {
    if (!therapistInfo?.id) {
      toast.error('Therapist ID not found')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/therapist/availability/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapist_id: therapistInfo.id,
          ...formData
        }),
      })

      if (response.ok) {
        toast.success('Availability override saved successfully')
        setIsDialogOpen(false)
        loadOverrides() // Reload the list
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save override')
      }
    } catch (error) {
      console.error('Error saving override:', error)
      toast.error('Failed to save override')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to delete this override?')) return

    try {
      const response = await fetch(`/api/therapist/availability/override?override_id=${overrideId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Override deleted successfully')
        loadOverrides() // Reload the list
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete override')
      }
    } catch (error) {
      console.error('Error deleting override:', error)
      toast.error('Failed to delete override')
    }
  }

  const getOverrideForDate = (date: string) => {
    return overrides.find(override => override.override_date === date)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const days = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dateString = date.toISOString().split('T')[0]
      const override = getOverrideForDate(dateString)
      const isCurrentMonth = date.getMonth() === month
      const isToday = date.toDateString() === today.toDateString()
      const isPast = date < today && !isToday
      
      days.push({
        date: dateString,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        override
      })
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Availability Overrides
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set specific date exceptions to your weekly schedule
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            ←
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            →
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isClickable = day.isCurrentMonth && !day.isPast
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-colors
                ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                ${day.isPast ? 'opacity-50 cursor-not-allowed' : ''}
                ${day.override ? 'bg-blue-50 border-blue-200' : ''}
              `}
              onClick={() => isClickable && handleAddOverride(day.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${day.isToday ? 'font-bold text-blue-600' : ''}`}>
                  {day.day}
                </span>
                {day.override && (
                  <div className="flex gap-1">
                    {day.override.is_available ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              
              {day.override && (
                <div className="text-xs space-y-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      day.override.is_available 
                        ? 'border-green-300 text-green-700 bg-green-50' 
                        : 'border-red-300 text-red-700 bg-red-50'
                    }`}
                  >
                    {day.override.is_available ? 'Custom Hours' : 'Unavailable'}
                  </Badge>
                  {day.override.reason && (
                    <div className="text-xs text-gray-600 truncate">
                      {day.override.reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Override Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDate && formatDate(selectedDate)} - Availability Override
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Availability Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
              />
              <Label className="text-base">
                {formData.is_available ? 'Available with custom hours' : 'Unavailable (day off)'}
              </Label>
            </div>

            {/* Custom Hours (only if available) */}
            {formData.is_available && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Custom Hours</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Session Duration</Label>
                    <Select
                      value={formData.session_duration?.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, session_duration: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-1">
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
                      value={formData.max_sessions}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_sessions: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label className="text-sm font-medium">Reason (optional)</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveOverride}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Override
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Override Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Click on any future date to set an override</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Set "Unavailable" for complete day offs (vacation, sick days)</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Set "Custom Hours" for partial availability (training, appointments)</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span>Overrides take precedence over your weekly schedule</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
