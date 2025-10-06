"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { 
  Settings, 
  Clock, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Moon,
  Sun,
  Zap
} from "lucide-react"
import { SessionSettings } from "@/types/availability"

interface SessionSettingsEditorProps {
  settings: SessionSettings
  onSettingsChange: (settings: SessionSettings) => void
}

const SESSION_DURATION_OPTIONS = [
  { value: 30, label: '30 minutes', icon: Coffee },
  { value: 45, label: '45 minutes', icon: Clock },
  { value: 60, label: '1 hour', icon: Clock },
  { value: 90, label: '1.5 hours', icon: Moon },
  { value: 120, label: '2 hours', icon: Sun },
  { value: 180, label: '3 hours', icon: Zap },
]

const BUFFER_TIME_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
]

const ADVANCE_BOOKING_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
]

const CANCELLATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '72 hours' },
]

export function SessionSettingsEditor({ settings, onSettingsChange }: SessionSettingsEditorProps) {
  const [editedSettings, setEditedSettings] = useState<SessionSettings>({ ...settings })

  const handleChange = (field: keyof SessionSettings, value: any) => {
    const newSettings = { ...editedSettings, [field]: value }
    setEditedSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const getDurationIcon = (duration: number) => {
    const option = SESSION_DURATION_OPTIONS.find(opt => opt.value === duration)
    return option?.icon || Clock
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Session Settings
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default session parameters and booking rules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Default Session Duration</Label>
              <Select
                value={editedSettings.sessionDuration.toString()}
                onValueChange={(value) => handleChange('sessionDuration', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_DURATION_OPTIONS.map(option => {
                    const Icon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Buffer Time Between Sessions</Label>
              <Select
                value={editedSettings.bufferTime.toString()}
                onValueChange={(value) => handleChange('bufferTime', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUFFER_TIME_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Time between sessions for breaks and preparation
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Maximum Sessions Per Day</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={editedSettings.maxSessionsPerDay}
                onChange={(e) => handleChange('maxSessionsPerDay', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limit to prevent overbooking
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Advance Booking Period</Label>
              <Select
                value={editedSettings.advanceBookingDays.toString()}
                onValueChange={(value) => handleChange('advanceBookingDays', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCE_BOOKING_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How far in advance clients can book sessions
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Cancellation Deadline</Label>
              <Select
                value={editedSettings.cancellationHours.toString()}
                onValueChange={(value) => handleChange('cancellationHours', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum time before session to cancel without penalty
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Settings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                {React.createElement(getDurationIcon(editedSettings.sessionDuration), { className: "h-4 w-4 text-blue-600" })}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Session Duration</p>
                <p className="text-xs text-blue-700">{editedSettings.sessionDuration} minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Buffer Time</p>
                <p className="text-xs text-green-700">{editedSettings.bufferTime} minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Max Sessions</p>
                <p className="text-xs text-purple-700">{editedSettings.maxSessionsPerDay} per day</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Advance Booking</p>
                <p className="text-xs text-orange-700">{editedSettings.advanceBookingDays} days</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Booking Rules Summary</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Clients can book up to {editedSettings.advanceBookingDays} days in advance</li>
              <li>• Cancellations must be made at least {editedSettings.cancellationHours} hours before the session</li>
              <li>• Maximum of {editedSettings.maxSessionsPerDay} sessions per day</li>
              <li>• {editedSettings.bufferTime} minute buffer between sessions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
