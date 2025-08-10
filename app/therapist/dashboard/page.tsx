import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Video, CheckCircle2, TrendingUp, Clock, Users } from "lucide-react"

export default function TherapistDashboardPage() {
  // Default data in case imports are not available during build
  const therapistSummaryCards = [
    {
      title: "Total Clients",
      value: "24",
      description: "Active clients",
      icon: Users,
    },
    {
      title: "Sessions This Month",
      value: "18",
      description: "Completed sessions",
      icon: CheckCircle2,
    },
    {
      title: "Average Rating",
      value: "4.8",
      description: "Client satisfaction",
      icon: TrendingUp,
    },
    {
      title: "Hours This Week",
      value: "12",
      description: "Total session hours",
      icon: Clock,
    },
  ]

  const therapistUpcomingSessions = [
    {
      id: "s1",
      date: "2025-09-15",
      time: "10:00 AM",
      clientName: "Sarah Johnson",
      type: "CBT Session",
      link: "#",
    },
    {
      id: "s2",
      date: "2025-09-15",
      time: "02:30 PM",
      clientName: "Michael Chen",
      type: "Trauma Therapy",
      link: "#",
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
        <h1 className="text-2xl font-semibold text-foreground">Welcome, Dr. Emily White</h1>
        <p className="text-sm text-muted-foreground mt-1">Licensed Therapist • MBA Psychology</p>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {therapistSummaryCards.map((card, index) => (
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
            <p>• Reminder: Your profile review is due by September 30th.</p>
            <p>• New feature: Enhanced client notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
