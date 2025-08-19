"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, User, Mail, Settings } from "lucide-react"

export default function TestTherapistFlowPage() {
  const [therapists, setTherapists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTherapists()
  }, [])

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/therapists')
      const data = await response.json()
      if (data.success) {
        setTherapists(data.therapists)
      }
    } catch (error) {
      console.error('Error fetching therapists:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailabilityStatus = (therapist: any) => {
    if (therapist.is_active) {
      return { status: 'Available', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else {
      return { status: 'Unavailable', color: 'bg-gray-100 text-gray-600', icon: XCircle }
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Therapist Flow Test</h1>
        <p className="text-muted-foreground mb-4">
          This page shows the current status of therapists and their availability.
        </p>
        
        <div className="flex gap-4 mb-6 flex-wrap">
          <Button onClick={fetchTherapists} variant="outline">
            Refresh Data
          </Button>
          <Button asChild>
            <a href="/therapist/enroll" target="_blank">
              Enroll as Therapist
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/book" target="_blank">
              Test Booking Flow
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/therapist/dashboard" target="_blank">
              <Settings className="h-4 w-4 mr-2" />
              Access Therapist Dashboard
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Available Therapists ({therapists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Loading therapists...</p>
              </div>
            ) : therapists.length > 0 ? (
              <div className="grid gap-4">
                {therapists.map((therapist) => {
                  const availability = getAvailabilityStatus(therapist)
                  const IconComponent = availability.icon
                  
                  return (
                    <div key={therapist.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{therapist.name}</h3>
                          {therapist.is_verified && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <Badge className={availability.color}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {availability.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{therapist.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Specialization:</span>
                          <br />
                          <span className="font-medium">{therapist.specialization}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span>
                          <br />
                          <span className="font-medium text-green-600">
                            ₦{therapist.hourly_rate?.toLocaleString() || 'N/A'}/hr
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <br />
                          <span className={`font-medium ${
                            therapist.is_active ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {therapist.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No therapists found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try enrolling a therapist first
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Enroll as Therapist</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Enroll as Therapist" button</li>
                <li>Fill out the enrollment form</li>
                <li>Check email for verification link</li>
                <li>Click the verification link</li>
                <li>Login to therapist dashboard</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Set Availability</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to therapist dashboard</li>
                <li>Navigate to Availability settings</li>
                <li>Toggle "Active for Client Bookings"</li>
                <li>Set weekly schedule</li>
                <li>Save the schedule</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Test User Booking</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Test Booking Flow" button</li>
                <li>Fill out patient biodata</li>
                <li>Select a therapist (should show availability)</li>
                <li>Complete the booking process</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">4. Quick Access (For Testing)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Access Therapist Dashboard" button</li>
                <li>This will take you directly to the dashboard</li>
                <li>If it's loading, check the browser console for errors</li>
                <li>Refresh the page if needed</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
