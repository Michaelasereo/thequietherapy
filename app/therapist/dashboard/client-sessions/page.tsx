"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CalendarIcon, Video, History } from "lucide-react"
import { format } from "date-fns"
import { therapistUpcomingSessions, therapistPastSessions } from "@/lib/therapist-data"

export default function TherapistClientSessionsPage() {
  const [tab, setTab] = useState("upcoming")

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Client Sessions</h2>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
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
                          Client: {session.clientName} • {session.type}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto bg-transparent" asChild>
                        <a href={session.link} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-4 w-4" /> Join
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
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {therapistPastSessions.length > 0 ? (
                <div className="space-y-4">
                  {therapistPastSessions.map((session) => (
                    <div key={session.id} className="flex items-start gap-4 p-3 rounded-md bg-muted/30">
                      <History className="h-6 w-6 text-muted-foreground" />
                      <div className="grid gap-0.5">
                        <p className="font-medium">
                          {format(new Date(session.date), "PPP")} at {session.time}
                        </p>
                        <p className="text-sm text-muted-foreground">Client: {session.clientName}</p>
                        <p className="text-sm">{session.summary}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto bg-transparent">
                        View Notes
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past sessions.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


