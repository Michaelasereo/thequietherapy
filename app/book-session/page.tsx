"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Brain, CalendarIcon, Clock, User, ArrowLeft, CheckCircle, Video } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Therapist {
  id: string
  full_name: string
  specialization: string
  bio: string
  hourly_rate: number
}

export default function BookSessionPage() {
  const router = useRouter()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [topic, setTopic] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  useEffect(() => {
    // Fetch therapists
    const fetchTherapists = async () => {
      try {
        const response = await fetch('/api/therapists')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTherapists(data.therapists)
          }
        }
      } catch (error) {
        console.error('Failed to fetch therapists:', error)
      }
    }

    fetchTherapists()
  }, [])

  const handleBooking = async () => {
    if (!selectedTherapist || !selectedDate || !selectedTime) {
      alert('Please fill in all required fields')
      return
    }

    setIsBooking(true)

    try {
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: selectedTherapist,
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          scheduledTime: selectedTime,
          durationMinutes: 60,
          topic: topic || 'Therapy session'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSessionData(data.session)
        setBookingSuccess(true)
      } else {
        alert(data.error || 'Failed to book session')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to book session')
    } finally {
      setIsBooking(false)
    }
  }

  const selectedTherapistData = therapists.find(t => t.id === selectedTherapist)

  if (bookingSuccess && sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Session Booked!</CardTitle>
              <p className="text-muted-foreground">Your therapy session has been scheduled</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">{sessionData.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(sessionData.scheduledDate), 'EEEE, MMMM d, yyyy')} at {sessionData.scheduledTime}
                </p>
                <p className="text-sm text-muted-foreground">Therapist: {sessionData.therapist}</p>
              </div>

              {sessionData.dailyRoomUrl && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Video Session Ready</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your video room has been created and will be available 5 minutes before your session.
                  </p>
                  <Button asChild className="w-full">
                    <a href={sessionData.dailyRoomUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="mr-2 h-4 w-4" />
                      Join Video Session
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/book-session">Book Another Session</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Book a Therapy Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Therapist Selection */}
                <div>
                  <Label htmlFor="therapist">Select Therapist</Label>
                  <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((therapist) => (
                        <SelectItem key={therapist.id} value={therapist.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{therapist.full_name}</span>
                            <span className="text-sm text-muted-foreground">{therapist.specialization}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <Label htmlFor="time">Select Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic */}
                <div>
                  <Label htmlFor="topic">Session Topic (Optional)</Label>
                  <Textarea
                    id="topic"
                    placeholder="What would you like to discuss in this session?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleBooking} 
                  disabled={isBooking || !selectedTherapist || !selectedDate || !selectedTime}
                  className="w-full"
                >
                  {isBooking ? "Booking..." : "Book Session"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Therapist Info */}
          {selectedTherapistData && (
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Therapist Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{selectedTherapistData.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTherapistData.specialization}</p>
                  </div>
                  <p className="text-sm">{selectedTherapistData.bio}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>${selectedTherapistData.hourly_rate}/hour</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
