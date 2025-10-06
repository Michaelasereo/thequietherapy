"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Clock, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Moon,
  Sun,
  Zap,
  Users,
  Video,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { 
  AvailabilityOverride, 
  TimeSlot,
  DEFAULT_TIME_SLOT,
  SESSION_TYPES,
  DEFAULT_SESSION_DURATIONS
} from "@/types/availability"
import { AvailabilityService } from "@/lib/availability-service"

interface AvailabilityOverridesProps {
  therapistId: string
  overrides: AvailabilityOverride[]
  onOverridesChange: (overrides: AvailabilityOverride[]) => void
}

const OVERRIDE_REASONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick_day', label: 'Sick Day' },
  { value: 'training', label: 'Training' },
  { value: 'conference', label: 'Conference' },
  { value: 'personal', label: 'Personal' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'other', label: 'Other' }
]

const SESSION_TYPE_ICONS = {
  individual: Users,
  group: Users,
  consultation: Video,
}

const DURATION_ICONS = {
  30: Coffee,
  45: Clock,
  60: Clock,
  90: Moon,
  120: Sun,
}

export function AvailabilityOverrides({ 
  therapistId, 
  overrides, 
  onOverridesChange 
}: AvailabilityOverridesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [editingOverride, setEditingOverride] = useState<AvailabilityOverride | null>(null)
  const [formData, setFormData] = useState<Partial<AvailabilityOverride>>({
    type: 'unavailable',
    isAvailable: false,
    reason: '',
    notes: '',
    customHours: {
      start: '09:00',
      end: '17:00',
      timeSlots: []
    }
  })

  const handleAddOverride = (date: Date) => {
    setSelectedDate(date)
    setFormData({
      type: 'unavailable',
      isAvailable: false,
      reason: '',
      notes: '',
      customHours: {
        start: '09:00',
        end: '17:00',
        timeSlots: []
      }
    })
    setEditingOverride(null)
    setIsDialogOpen(true)
  }

  const handleEditOverride = (override: AvailabilityOverride) => {
    setEditingOverride(override)
    setFormData(override)
    setSelectedDate(new Date(override.date))
    setIsDialogOpen(true)
  }

  const handleSaveOverride = async () => {
    if (!selectedDate) return

    try {
      const overrideData: Omit<AvailabilityOverride, 'id' | 'therapistId' | 'createdAt' | 'updatedAt'> = {
        date: selectedDate.toISOString().split('T')[0],
        type: formData.type || 'unavailable',
        isAvailable: formData.isAvailable || false,
        customHours: formData.isAvailable ? formData.customHours : undefined,
        reason: formData.reason || '',
        notes: formData.notes
      }

      const response = await fetch('/api/therapist/availability/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapist_id: therapistId,
          ...overrideData
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.override) {
          const newOverrides = editingOverride 
            ? overrides.map(o => o.id === editingOverride.id ? result.override : o)
            : [...overrides, result.override]
          onOverridesChange(newOverrides)
        }
        toast.success('Override saved successfully')
        setIsDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save override')
      }
    } catch (error) {
      console.error('Error saving override:', error)
      toast.error('Failed to save override')
    }
  }

  const handleDeleteOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to delete this override?')) return

    try {
      const response = await fetch(`/api/therapist/availability/override?override_id=${overrideId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const newOverrides = overrides.filter(o => o.id !== overrideId)
        onOverridesChange(newOverrides)
        toast.success('Override deleted successfully')
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
    return overrides.find(override => override.date === date)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getOverrideIcon = (type: string) => {
    switch (type) {
      case 'unavailable':
        return <X className="h-4 w-4 text-red-600" />
      case 'custom_hours':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'reduced_hours':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getOverrideColor = (type: string) => {
    switch (type) {
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'custom_hours':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reduced_hours':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Availability Overrides
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Set specific date exceptions to your weekly schedule
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                handleAddOverride(date)
              }
            }}
            className="rounded-md border"
            disabled={(date) => date < new Date()}
          />
        </CardContent>
      </Card>

      {/* Existing Overrides */}
      {overrides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overrides.map((override) => (
                <div 
                  key={override.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getOverrideIcon(override.type)}
                    <div>
                      <p className="font-medium">{formatDate(override.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {override.reason} • {override.isAvailable ? 'Custom hours' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getOverrideColor(override.type)}>
                      {override.type.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditOverride(override)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOverride(override.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Override Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {editingOverride ? 'Edit Override' : 'Add Override'} - {selectedDate && formatDate(selectedDate.toISOString().split('T')[0])}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Availability Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isAvailable || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
              />
              <Label className="text-base">
                {formData.isAvailable ? 'Available with custom hours' : 'Unavailable (day off)'}
              </Label>
            </div>

            {/* Custom Hours (only if available) */}
            {formData.isAvailable && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={formData.customHours?.start || '09:00'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customHours: { 
                            ...prev.customHours!, 
                            start: e.target.value 
                          } 
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">End Time</Label>
                      <Input
                        type="time"
                        value={formData.customHours?.end || '17:00'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customHours: { 
                            ...prev.customHours!, 
                            end: e.target.value 
                          } 
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Reason</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {OVERRIDE_REASONS.map(reason => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Notes (Optional)</Label>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reason for Unavailable */}
            {!formData.isAvailable && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {OVERRIDE_REASONS.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

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
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
