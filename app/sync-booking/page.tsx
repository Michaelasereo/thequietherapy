'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SyncBookingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    therapist_id: '',
    therapist_name: '',
    therapist_email: '',
    session_date: '',
    start_time: '',
    end_time: '',
    duration: '60',
    complaints: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/sync-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Booking synced successfully!')
        router.push('/dashboard/therapy')
      } else {
        toast.error(result.error || 'Failed to sync booking')
      }
    } catch (error) {
      console.error('Error syncing booking:', error)
      toast.error('Error syncing booking')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Sync Existing Booking
            </CardTitle>
            <p className="text-gray-600 text-center">
              Enter the details of your existing booking to create a session record
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="therapist_name">Therapist Name *</Label>
                  <Input
                    id="therapist_name"
                    value={formData.therapist_name}
                    onChange={(e) => handleInputChange('therapist_name', e.target.value)}
                    placeholder="e.g., Dr. Sarah Johnson"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="therapist_email">Therapist Email</Label>
                  <Input
                    id="therapist_email"
                    type="email"
                    value={formData.therapist_email}
                    onChange={(e) => handleInputChange('therapist_email', e.target.value)}
                    placeholder="therapist@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="therapist_id">Therapist ID *</Label>
                <Input
                  id="therapist_id"
                  value={formData.therapist_id}
                  onChange={(e) => handleInputChange('therapist_id', e.target.value)}
                  placeholder="e.g., edc0f851-3b81-4b24-a086-e4f0b03f001d"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This should be the ID from your original booking
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="session_date">Session Date *</Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => handleInputChange('session_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="end_time">End Time (optional)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  placeholder="Will be calculated from duration if not provided"
                />
              </div>

              <div>
                <Label htmlFor="complaints">Session Notes/Complaints</Label>
                <Textarea
                  id="complaints"
                  value={formData.complaints}
                  onChange={(e) => handleInputChange('complaints', e.target.value)}
                  placeholder="Any notes about this session or what you'd like to discuss"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Syncing...' : 'Sync Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Find Your Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p><strong>Therapist ID:</strong> Check your booking confirmation email or the URL when you selected the therapist</p>
            <p><strong>Therapist Name:</strong> The name of the therapist you booked with</p>
            <p><strong>Session Date & Time:</strong> The date and time you scheduled your appointment</p>
            <p><strong>Notes:</strong> Any specific concerns or topics you wanted to discuss</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
