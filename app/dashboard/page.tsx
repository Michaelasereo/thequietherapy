import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Video, CheckCircle, CheckCircle2, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"

function Video(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

export default function DashboardPage() {
  // Default data in case imports are not available during build
  const dashboardSummaryCards = [
    {
      title: "Total Sessions",
      value: "12",
      description: "Sessions completed so far",
      icon: CheckCircle2,
    },
    {
      title: "Upcoming Sessions",
      value: "2",
      description: "Scheduled for this month",
      icon: CalendarIcon,
    },
    {
      title: "Progress Score",
      value: "75%",
      description: "Based on recent assessments",
      icon: TrendingUp,
    },
    {
      title: "Average Session Time",
      value: "50 min",
      description: "Typical duration",
      icon: Clock,
    },
  ]

  const upcomingSessions = [
    {
      id: "s1",
      date: "2025-09-15",
      time: "10:00 AM",
      therapist: "Dr. Emily White",
      topic: "Coping with Stress",
    },
    {
      id: "s2",
      date: "2025-09-18",
      time: "02:30 PM",
      therapist: "Mr. John Davis",
      topic: "Processing Past Trauma",
    },
  ]

  const format = (date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, User!
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            Individual
          </p>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Credits: 15 • Package: Standard
        </p>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardSummaryCards.map((card, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Upcoming Sessions and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">
                        {format(new Date(session.date), "PPP")} at {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.therapist} • {session.topic}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto bg-transparent" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
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
            <div className="text-muted-foreground">Calendar component</div>
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
            <p>• Reminder: Your next session is scheduled for September 15th.</p>
            <p>• New feature: Enhanced session notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
