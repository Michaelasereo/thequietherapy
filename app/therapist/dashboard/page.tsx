"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Video } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import SummaryCard from "@/components/summary-card"
import { therapistSummaryCards, therapistUpcomingSessions } from "@/lib/therapist-data"
import { useTherapistUser } from "@/context/therapist-user-context"

export default function TherapistDashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { therapistUser } = useTherapistUser()

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {therapistUser?.name || "Therapist"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Licensed Therapist • MBA Psychology</p>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {therapistSummaryCards.map((card, index) => (
          <SummaryCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Upcoming Sessions and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {therapistUpcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {therapistUpcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">
                        {format(new Date(session.date), "PPP")} at {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Client: {session.clientName} - {session.type}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto bg-transparent" asChild>
                      <a href={session.link} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-2 h-4 w-4" /> Join Session
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      {/* Notifications / Important Updates section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notifications & Important Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>• Reminder: Your profile review is due by September 30th.</p>
            <p>• New feature: Enhanced client notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
