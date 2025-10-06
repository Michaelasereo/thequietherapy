"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Clock, 
  Plus, 
  Calendar
} from "lucide-react"
import { 
  WeeklyAvailability, 
  AvailabilityOverride, 
  WeeklyCalendarProps,
  TimeSlot,
  DAYS_OF_WEEK
} from "@/types/availability"

// General Hours Configuration Form Component
interface GeneralHoursFormProps {
  dayName: string
  onSave: (generalHours: { start: string; end: string; totalHours: number; sessionDuration: number; bufferTime: number }) => void
  onCancel: () => void
  initialData?: { start: string; end: string; totalHours: number; sessionDuration: number; bufferTime: number }
}

function GeneralHoursForm({ dayName, onSave, onCancel, initialData }: GeneralHoursFormProps) {
  const [startTime, setStartTime] = useState(initialData?.start || '09:00')
  const [endTime, setEndTime] = useState(initialData?.end || '17:00')
  const [totalHours, setTotalHours] = useState(initialData?.totalHours || 8)
  const [sessionDuration, setSessionDuration] = useState(initialData?.sessionDuration || 60)
  const [bufferTime, setBufferTime] = useState(initialData?.bufferTime || 15)

  const handleSave = () => {
    onSave({
      start: startTime,
      end: endTime,
      totalHours,
      sessionDuration,
      bufferTime
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Total Hours Available (Number of Sessions)</Label>
        <Input
          type="number"
          min="1"
          max="24"
          value={totalHours}
          onChange={(e) => setTotalHours(parseInt(e.target.value) || 1)}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">This equals the number of sessions you can take</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Session Duration (minutes)</Label>
          <Input
            type="number"
            min="30"
            max="180"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(parseInt(e.target.value) || 60)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Buffer Time (minutes)</Label>
          <Input
            type="number"
            min="0"
            max="60"
            value={bufferTime}
            onChange={(e) => setBufferTime(parseInt(e.target.value) || 15)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Apply Hours
        </Button>
      </div>
    </div>
  )
}

// Custom Time Slot Form Component
interface CustomTimeSlotFormProps {
  dayName: string
  onSave: (slot: TimeSlot) => void
  onCancel: () => void
  editingSlot?: TimeSlot | null
}

function CustomTimeSlotForm({ dayName, onSave, onCancel, editingSlot }: CustomTimeSlotFormProps) {
  const [startTime, setStartTime] = useState(editingSlot?.start || '09:00')
  const [endTime, setEndTime] = useState(editingSlot?.end || '10:00')

  const handleSave = () => {
    const slot: TimeSlot = editingSlot ? {
      ...editingSlot,
      start: startTime,
      end: endTime,
      duration: 60, // Default 60 minutes
    } : {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start: startTime,
      end: endTime,
      duration: 60, // Default 60 minutes
      type: 'individual',
      maxSessions: 1,
      title: 'Custom Session',
      isAvailable: true
    }
    onSave(slot)
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Custom slots override your general availability for this day.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editingSlot ? 'Update Slot' : 'Add Slot'}
        </Button>
      </div>
    </div>
  )
}

export function WeeklyCalendar({ 
  availability, 
  onAvailabilityChange, 
  readOnly = false 
}: WeeklyCalendarProps) {
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [showGeneralHoursDialog, setShowGeneralHoursDialog] = useState(false)
  const [showCustomSlotDialog, setShowCustomSlotDialog] = useState(false)

  const handleDayToggle = (dayName: string, enabled: boolean) => {
    const currentDayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [dayName]: {
          ...currentDayAvailability,
          enabled,
          timeSlots: enabled ? (currentDayAvailability?.timeSlots || []) : []
        }
      }
    }
    
    onAvailabilityChange(updatedAvailability)
  }

  const handleSlotSave = (slot: TimeSlot) => {
    const dayName = selectedDay
    const currentDayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    const currentTimeSlots = currentDayAvailability?.timeSlots || []
    
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [dayName]: {
          ...currentDayAvailability,
          timeSlots: editingSlot 
            ? currentTimeSlots.map(s => s.id === slot.id ? slot : s)
            : [...currentTimeSlots, slot]
        }
      }
    }
    
    onAvailabilityChange(updatedAvailability)
    setIsSlotDialogOpen(false)
    setEditingSlot(null)
  }

  const handleSlotDelete = (slotId: string, dayName: string) => {
    const currentDayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    const currentTimeSlots = currentDayAvailability?.timeSlots || []
    
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [dayName]: {
          ...currentDayAvailability,
          timeSlots: currentTimeSlots.filter(slot => slot.id !== slotId)
        }
      }
    }
    
    onAvailabilityChange(updatedAvailability)
  }

  const handleSetGeneralHours = (dayName: string, generalHours: { start: string; end: string; totalHours: number; sessionDuration: number; bufferTime: number }) => {
    const currentDayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [dayName]: {
          ...currentDayAvailability,
          generalHours
        }
      }
    }
    onAvailabilityChange(updatedAvailability)
    setShowGeneralHoursDialog(false)
  }

  const handleAddCustomSlot = (dayName: string) => {
    setSelectedDay(dayName)
    setShowCustomSlotDialog(true)
  }

  const handleCustomSlotSave = (slot: TimeSlot) => {
    const currentDayAvailability = availability.standardHours[selectedDay as keyof typeof availability.standardHours]
    const updatedSlots = editingSlot 
      ? currentDayAvailability?.customSlots?.map(s => s.id === editingSlot.id ? slot : s) || []
      : [...(currentDayAvailability?.customSlots || []), slot]
    
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [selectedDay]: {
          ...currentDayAvailability,
          customSlots: updatedSlots
        }
      }
    }
    onAvailabilityChange(updatedAvailability)
    setShowCustomSlotDialog(false)
    setEditingSlot(null)
  }

  const handleCustomSlotDelete = (slotId: string, dayName: string) => {
    const currentDayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    const updatedSlots = currentDayAvailability?.customSlots?.filter(s => s.id !== slotId) || []
    
    const updatedAvailability = { 
      ...availability,
      standardHours: {
        ...availability.standardHours,
        [dayName]: {
          ...currentDayAvailability,
          customSlots: updatedSlots
        }
      }
    }
    onAvailabilityChange(updatedAvailability)
  }

  const handleAddSlot = (dayName: string) => {
    setSelectedDay(dayName)
    setEditingSlot(null)
    setIsSlotDialogOpen(true)
  }

  const handleEditSlot = (slot: TimeSlot, dayName: string) => {
    setSelectedDay(dayName)
    setEditingSlot(slot)
    setIsSlotDialogOpen(true)
  }


  // Get day availability status
  const getDayStatus = (dayName: string) => {
    const dayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
    if (!dayAvailability || !dayAvailability.enabled) {
      return "Not available"
    }
    
    // Check if custom slots override general hours
    const customSlotsCount = dayAvailability.customSlots?.length || 0
    if (customSlotsCount > 0) {
      return `${customSlotsCount} custom slot${customSlotsCount !== 1 ? 's' : ''} (override)`
    }
    
    // Check general hours
    if (dayAvailability.generalHours) {
      const { totalHours } = dayAvailability.generalHours
      return `${totalHours} hour${totalHours !== 1 ? 's' : ''} available (${totalHours} sessions)`
    }
    
    // Fallback to legacy timeSlots
    const slotCount = dayAvailability.timeSlots?.length || 0
    if (slotCount === 0) {
      return "Available (no hours set)"
    }
    return `${slotCount} time slot${slotCount !== 1 ? 's' : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Weekly Schedule
          </h2>
          <p className="text-gray-600">Set Your Weekly Schedule</p>
          <p className="text-sm text-gray-500">Configure your availability for each day of the week</p>
        </div>
      </div>

      {/* Days of Week List */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((dayName) => {
              const dayAvailability = availability.standardHours[dayName as keyof typeof availability.standardHours]
              const isEnabled = dayAvailability?.enabled || false
              const daySlots = dayAvailability?.timeSlots || []
              
              return (
                <div key={dayName} className="space-y-3">
                  {/* Day Header */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleDayToggle(dayName, checked)}
                        disabled={readOnly}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize text-lg">{dayName}</h3>
                        <p className="text-sm text-gray-500">{getDayStatus(dayName)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEnabled && (
                        <>
                          {!dayAvailability.generalHours && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDay(dayName)
                                setShowGeneralHoursDialog(true)
                              }}
                              disabled={readOnly}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Set Hours
                            </Button>
                          )}
                          
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => handleAddCustomSlot(dayName)}
                          disabled={readOnly}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                            Custom Slot
                        </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* General Hours Display */}
                  {isEnabled && dayAvailability.generalHours && (
                    <div className="ml-12 space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">
                                General Hours: {dayAvailability.generalHours.start} - {dayAvailability.generalHours.end}
                              </p>
                              <p className="text-sm text-blue-700">
                                {dayAvailability.generalHours.totalHours} sessions • {dayAvailability.generalHours.sessionDuration}min each • {dayAvailability.generalHours.bufferTime}min buffer
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDay(dayName)
                                setShowGeneralHoursDialog(true)
                              }}
                              disabled={readOnly}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                              Edit Hours
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Slots Display */}
                  {isEnabled && dayAvailability.customSlots && dayAvailability.customSlots.length > 0 && (
                    <div className="ml-12 space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">Custom Override Slots:</div>
                      {dayAvailability.customSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <div>
                              <p className="font-medium text-yellow-900">
                                {slot.start} to {slot.end}
                              </p>
                              <p className="text-sm text-yellow-700">
                                {slot.duration} minutes • Custom override
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSlot(slot)
                                setSelectedDay(dayName)
                                setShowCustomSlotDialog(true)
                              }}
                              disabled={readOnly}
                              className="text-yellow-600 border-yellow-300 hover:bg-yellow-100"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCustomSlotDelete(slot.id, dayName)}
                              disabled={readOnly}
                              className="text-red-600 border-red-300 hover:bg-red-100"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Legacy Time Slots Display */}
                  {isEnabled && daySlots.length > 0 && !dayAvailability.generalHours && !dayAvailability.customSlots && (
                    <div className="ml-12 space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">Legacy Time Slots:</div>
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {slot.start} to {slot.end}
                              </p>
                              <p className="text-sm text-gray-500">
                                {slot.duration} minutes • {slot.type}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSlot(slot, dayName)}
                              disabled={readOnly}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSlotDelete(slot.id, dayName)}
                              disabled={readOnly}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>


      {/* Time Slot Dialog */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </DialogTitle>
          </DialogHeader>
          
          <SimpleTimeSlotForm
            dayName={selectedDay}
            onSave={handleSlotSave}
            onCancel={() => setIsSlotDialogOpen(false)}
            editingSlot={editingSlot}
          />
        </DialogContent>
      </Dialog>

      {/* General Hours Dialog */}
      <Dialog open={showGeneralHoursDialog} onOpenChange={setShowGeneralHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set General Hours for {selectedDay}</DialogTitle>
          </DialogHeader>
          
          <GeneralHoursForm
            dayName={selectedDay}
            onSave={(generalHours) => handleSetGeneralHours(selectedDay, generalHours)}
            onCancel={() => setShowGeneralHoursDialog(false)}
            initialData={availability.standardHours[selectedDay as keyof typeof availability.standardHours]?.generalHours}
          />
        </DialogContent>
      </Dialog>

      {/* Custom Slot Dialog */}
      <Dialog open={showCustomSlotDialog} onOpenChange={setShowCustomSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Custom Slot' : 'Add Custom Slot'} for {selectedDay}
            </DialogTitle>
          </DialogHeader>
          
          <CustomTimeSlotForm
            dayName={selectedDay}
            onSave={handleCustomSlotSave}
            onCancel={() => {
              setShowCustomSlotDialog(false)
              setEditingSlot(null)
            }}
            editingSlot={editingSlot}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Simple Time Slot Form Component (Legacy support)
interface SimpleTimeSlotFormProps {
  dayName: string
  onSave: (slot: TimeSlot) => void
  onCancel: () => void
  editingSlot?: TimeSlot | null
}

function SimpleTimeSlotForm({ dayName, onSave, onCancel, editingSlot }: SimpleTimeSlotFormProps) {
  const [startTime, setStartTime] = useState(editingSlot?.start || '09:00')
  const [endTime, setEndTime] = useState(editingSlot?.end || '10:00')

  const handleSave = () => {
    const slot: TimeSlot = editingSlot ? {
      ...editingSlot,
      start: startTime,
      end: endTime,
      duration: 60, // Default 60 minutes
    } : {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start: startTime,
      end: endTime,
      duration: 60, // Default 60 minutes
      type: 'individual',
      maxSessions: 1,
      title: 'Session',
      isAvailable: true
    }
    onSave(slot)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {editingSlot ? 'Update Slot' : 'Add Slot'}
        </Button>
      </div>
    </div>
  )
}