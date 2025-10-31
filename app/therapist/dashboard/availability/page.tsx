"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, CheckCircle2, Calendar as CalendarIcon } from "lucide-react"
import { useTherapistData } from "@/hooks/useTherapistDashboardState"
import { AvailabilityManager } from "@/components/availability/AvailabilityManager"
import { AvailabilityOverrides } from "@/components/availability-overrides"

export default function TherapistAvailabilityPage() {
  const { therapistInfo, fetchTherapistData } = useTherapistData()
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [availabilityApproved, setAvailabilityApproved] = useState(false)
  const [availabilityMode, setAvailabilityMode] = useState<'weekly' | 'overrides'>('weekly')

  useEffect(() => {
    fetchTherapistData()
  }, []) // Remove fetchTherapistData from dependencies to prevent infinite loop

  useEffect(() => {
    if (therapistInfo) {
      setIsActive(therapistInfo.isActive)
      setAvailabilityApproved(therapistInfo.availability_approved || false)
    }
  }, [therapistInfo])

  // Add a manual refresh effect
  useEffect(() => {
    const handleRefresh = () => {
      fetchTherapistData()
    }

    // Listen for the global refresh event
    window.addEventListener('therapist-data-refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('therapist-data-refresh', handleRefresh)
    }
  }, [])

  const handleToggleActive = async (checked: boolean) => {
    console.log('🔄 Toggling availability to:', checked)
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
        const result = await response.json()
        console.log('✅ Availability toggle successful:', result)
        setIsActive(checked)
        // Trigger a refresh of therapist data to sync with server
        console.log('🔄 Refreshing therapist data after availability toggle...')
        fetchTherapistData()
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to update availability:', errorData)
      }
    } catch (error) {
      console.error('❌ Error updating availability:', error)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Availability Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your availability and visibility to clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchTherapistData()}
            variant="outline"
            size="sm"
          >
            Refresh Data
          </Button>
        </div>
      </div>


      {/* Not Approved Alert */}
      {!availabilityApproved && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your availability settings will be accessible once your therapist application is approved by our admin team.
          </AlertDescription>
        </Alert>
      )}

      {/* Active/Inactive Toggle */}
      {availabilityApproved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Availability Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="active-toggle" className="text-base font-medium">
                  Available for Client Bookings
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control your visibility to clients. Toggle OFF if you need to temporarily stop accepting new bookings. You can still manage your schedule settings below regardless of this toggle.
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              {isActive ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">🟢 Available - Clients can book with you</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">⚫ Temporarily Unavailable - Not accepting new bookings</span>
                </>
              )}
            </div>

          </CardContent>
        </Card>
      )}



      {/* Availability Mode Toggle */}
      {availabilityApproved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Availability Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Choose Your Availability Method</Label>
                <p className="text-sm text-muted-foreground">
                  Set your weekly schedule or manage date exceptions
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={availabilityMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAvailabilityMode('weekly')}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Weekly Schedule
                </Button>
                <Button
                  variant={availabilityMode === 'overrides' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAvailabilityMode('overrides')}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Date Overrides
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      {availabilityApproved && availabilityMode === 'weekly' && therapistInfo?.id && (
        <AvailabilityManager 
          therapistId={therapistInfo.id}
          onSave={(availability) => {
            console.log('Availability saved:', availability)
            // Optionally refresh therapist data
            fetchTherapistData()
          }}
          onError={(error) => {
            console.error('Availability error:', error)
          }}
        />
      )}

      {/* Date Overrides */}
      {availabilityApproved && availabilityMode === 'overrides' && therapistInfo?.id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Date Overrides (Legacy)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Availability Overrides
            </p>
            <p className="text-sm text-muted-foreground">
              Set specific date exceptions to your weekly schedule
            </p>
          </CardHeader>
          <CardContent>
            <AvailabilityOverrides />
          </CardContent>
        </Card>
      )}

      {/* Session Settings */}
      {availabilityApproved && (
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
