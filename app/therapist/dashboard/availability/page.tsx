"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, CheckCircle2, Calendar } from "lucide-react"
import { useTherapistData } from "@/hooks/useTherapistDashboardState"
import { AvailabilitySchedule } from "@/components/availability-schedule"

export default function TherapistAvailabilityPage() {
  const { therapistInfo, fetchTherapistData } = useTherapistData()
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTherapistData()
  }, [fetchTherapistData])

  useEffect(() => {
    if (therapistInfo) {
      setIsActive(therapistInfo.isActive)
    }
  }, [therapistInfo])

  const handleToggleActive = async (checked: boolean) => {
    if (!therapistInfo?.isApproved) {
      return // Don't allow toggling if not approved
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: checked
        }),
      })

      if (response.ok) {
        setIsActive(checked)
        // Refresh therapist data
        fetchTherapistData()
      } else {
        console.error('Failed to update availability')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Availability Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your availability and visibility to clients
        </p>
      </div>

      {/* Approval Status Alert */}
      {!therapistInfo?.isVerified && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You need to verify your email before you can manage availability.
          </AlertDescription>
        </Alert>
      )}

      {therapistInfo?.isVerified && !therapistInfo?.isApproved && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your account is pending admin approval. You'll be able to set availability once approved.
          </AlertDescription>
        </Alert>
      )}

      {therapistInfo?.isVerified && therapistInfo?.isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your account is approved! You can now manage your availability and accept clients.
          </AlertDescription>
        </Alert>
      )}

      {/* Active/Inactive Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="active-toggle" className="text-base font-medium">
                Active for Client Bookings
              </Label>
              <p className="text-sm text-muted-foreground">
                When active, clients can see and book sessions with you. When inactive, you won't appear in client searches.
              </p>
            </div>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={!therapistInfo?.isApproved || isLoading}
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isActive ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Active - Available for bookings</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">Inactive - Not available for bookings</span>
              </>
            )}
          </div>

          {!therapistInfo?.isApproved && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              ⚠️ You need admin approval before you can set your availability status.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      {therapistInfo?.isApproved && isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilitySchedule />
          </CardContent>
        </Card>
      )}

      {/* Session Settings */}
      {therapistInfo?.isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Session Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Session Duration</Label>
                <p className="text-sm text-muted-foreground">Default session length</p>
              </div>
              <span className="text-sm font-medium">60 minutes</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Hourly Rate</Label>
                <p className="text-sm text-muted-foreground">Your session fee</p>
              </div>
              <span className="text-sm font-medium">₦{therapistInfo?.hourlyRate || 5000}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
