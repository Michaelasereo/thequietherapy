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
import { 
  Clock, 
  Save, 
  X, 
  Users, 
  Video, 
  MessageSquare,
  Coffee,
  Moon,
  Sun,
  Zap,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { 
  TimeSlot, 
  TimeSlotEditorProps,
  DEFAULT_TIME_SLOT,
  SESSION_TYPES,
  DEFAULT_SESSION_DURATIONS
} from "@/types/availability"
import { AvailabilityService } from "@/lib/availability-service"

const SESSION_TYPE_ICONS = {
  individual: Users,
  group: Users,
  consultation: Video,
}

const SESSION_TYPE_LABELS = {
  individual: 'Individual Session',
  group: 'Group Session',
  consultation: 'Consultation',
}

const SESSION_TYPE_COLORS = {
  individual: 'bg-blue-100 text-blue-800 border-blue-200',
  group: 'bg-green-100 text-green-800 border-green-200',
  consultation: 'bg-purple-100 text-purple-800 border-purple-200',
}

const DURATION_ICONS = {
  30: Coffee,
  45: Clock,
  60: Clock,
  90: Moon,
  120: Sun,
}

export function TimeSlotEditor({ 
  timeSlot, 
  onUpdate, 
  onDelete, 
  onCancel,
  availableTypes = ['individual', 'group', 'consultation'],
  maxDuration = 180
}: TimeSlotEditorProps & { onCancel?: () => void }) {
  const [editedSlot, setEditedSlot] = useState<TimeSlot>({ ...timeSlot })
  const [errors, setErrors] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(true)

  useEffect(() => {
    // Auto-calculate end time when start time or duration changes
    const endTime = AvailabilityService.calculateEndTime(editedSlot.start, editedSlot.duration)
    setEditedSlot(prev => ({ ...prev, end: endTime }))
  }, [editedSlot.start, editedSlot.duration])

  const validateTimeSlot = (slot: TimeSlot): string[] => {
    const validationErrors: string[] = []

    // Validate start time
    if (!slot.start || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.start)) {
      validationErrors.push('Start time must be in HH:MM format')
    }

    // Validate end time
    if (!slot.end || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.end)) {
      validationErrors.push('End time must be in HH:MM format')
    }

    // Validate duration
    if (slot.duration <= 0 || slot.duration > maxDuration) {
      validationErrors.push(`Duration must be between 1 and ${maxDuration} minutes`)
    }

    // Validate max sessions
    if (slot.maxSessions <= 0 || slot.maxSessions > 20) {
      validationErrors.push('Max sessions must be between 1 and 20')
    }

    // Validate title
    if (!slot.title || slot.title.trim().length === 0) {
      validationErrors.push('Session title is required')
    }

    // Check if start time is before end time
    if (slot.start && slot.end) {
      const startMinutes = AvailabilityService['timeToMinutes'](slot.start)
      const endMinutes = AvailabilityService['timeToMinutes'](slot.end)
      
      if (startMinutes >= endMinutes) {
        validationErrors.push('Start time must be before end time')
      }
    }

    return validationErrors
  }

  const handleSave = () => {
    const validationErrors = validateTimeSlot(editedSlot)
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    onUpdate(editedSlot)
    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      onDelete(timeSlot.id)
      setIsDialogOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setIsDialogOpen(false)
  }

  const getSessionTypeIcon = (type: string) => {
    const Icon = SESSION_TYPE_ICONS[type as keyof typeof SESSION_TYPE_ICONS] || Users
    return <Icon className="h-4 w-4" />
  }

  const getDurationIcon = (duration: number) => {
    const Icon = DURATION_ICONS[duration as keyof typeof DURATION_ICONS] || Clock
    return <Icon className="h-4 w-4" />
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Time Slot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Time Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <Input
                    type="time"
                    value={editedSlot.start}
                    onChange={(e) => setEditedSlot(prev => ({ ...prev, start: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    End Time 
                    <Badge variant="outline" className="text-xs">
                      Auto-calculated
                    </Badge>
                  </Label>
                  <Input
                    type="time"
                    value={editedSlot.end}
                    onChange={(e) => setEditedSlot(prev => ({ ...prev, end: e.target.value }))}
                    className="mt-1 bg-gray-50"
                    title="End time is automatically calculated based on start time and duration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Session Duration</Label>
                  <Select
                    value={editedSlot.duration.toString()}
                    onValueChange={(value) => setEditedSlot(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_SESSION_DURATIONS.filter(duration => duration <= maxDuration).map(duration => (
                        <SelectItem key={duration} value={duration.toString()}>
                          <div className="flex items-center gap-2">
                            {getDurationIcon(duration)}
                            {duration} minutes
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
                    max="20"
                    value={editedSlot.maxSessions}
                    onChange={(e) => setEditedSlot(prev => ({ ...prev, maxSessions: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Session Title</Label>
                <Input
                  value={editedSlot.title}
                  onChange={(e) => setEditedSlot(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Individual Therapy Session"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Session Type</Label>
                <Select
                  value={editedSlot.type}
                  onValueChange={(value: 'individual' | 'group' | 'consultation') => 
                    setEditedSlot(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getSessionTypeIcon(type)}
                          {SESSION_TYPE_LABELS[type as keyof typeof SESSION_TYPE_LABELS]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Description (Optional)</Label>
                <Textarea
                  value={editedSlot.description || ''}
                  onChange={(e) => setEditedSlot(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description for this time slot..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedSlot.isAvailable}
                  onCheckedChange={(checked) => setEditedSlot(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label className="text-sm">Available for booking</Label>
              </div>
            </CardContent>
          </Card>

          {/* Session Type Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${SESSION_TYPE_COLORS[editedSlot.type]}`}>
                  {getSessionTypeIcon(editedSlot.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{editedSlot.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {editedSlot.start} - {editedSlot.end} • {editedSlot.duration} min
                  </p>
                  {editedSlot.description && (
                    <p className="text-xs text-muted-foreground mt-1">{editedSlot.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {editedSlot.maxSessions} max
                  </Badge>
                  {editedSlot.isAvailable ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      <X className="h-3 w-3 mr-1" />
                      Unavailable
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Delete Slot
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
