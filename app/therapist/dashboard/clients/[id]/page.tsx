import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, FileText, Stethoscope, Pill } from "lucide-react"

function formatDate(input: string) {
  return new Date(input).toLocaleDateString()
}

export default function TherapistClientDetailsPage({ params }: { params: { id: string } }) {
  // Default data in case imports are not available during build
  const therapistClients = [
    {
      id: "1",
      name: "Sarah Johnson",
      picture: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      lastSeen: "2 days ago",
      sessions: [
        { id: "s1", date: "2024-09-15", time: "10:00 AM", type: "CBT" },
        { id: "s2", date: "2024-09-08", time: "10:00 AM", type: "CBT" }
      ],
      notes: [
        {
          date: "2024-09-15",
          summary: "Discussed anxiety management techniques and assigned homework.",
          tags: ["Anxiety", "CBT", "Homework"]
        },
        {
          date: "2024-09-08", 
          summary: "Initial assessment session. Patient showed good engagement.",
          tags: ["Assessment", "Engagement"]
        }
      ],
      medicalHistory: [
        {
          condition: "Generalized Anxiety Disorder",
          notes: "Diagnosed by primary care physician",
          diagnosisDate: "2023-01-10"
        }
      ]
    }
  ]

  const id = params.id
  const baseClient = therapistClients.find((c) => c.id === id)
  if (!baseClient) return <div>Client not found</div>

  const notes = baseClient.notes
  const newNote = ""

  const totalSessions = baseClient.sessions.length
  const totalNotes = notes.length
  const lastSeen = baseClient.lastSeen
  const amountEarned = `$${(totalSessions * 50).toFixed(2)}`
  const hasUpcoming = baseClient.sessions.some((s) => new Date(s.date) > new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost">
          <Link href="/therapist/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={baseClient.picture} alt={baseClient.name} className="h-16 w-16 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">{baseClient.name}</h1>
            <p className="text-sm text-muted-foreground">Last seen {lastSeen}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/therapist/dashboard/patient-medical-history/${id}`}>
              <Stethoscope className="mr-2 h-4 w-4" />
              Medical History
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalNotes}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Amount Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{amountEarned}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{hasUpcoming ? "Yes" : "No"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Medical History Preview */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Medical History Preview
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/therapist/dashboard/patient-medical-history/${id}`}>
              Manage Medical History
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {baseClient.medicalHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical history recorded yet.</p>
              <p className="text-sm">Click "Manage Medical History" to add diagnoses and medications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {baseClient.medicalHistory.map((m, idx) => (
                <div key={idx} className="p-3 rounded-md bg-muted/40">
                  <div className="font-medium">{m.condition}</div>
                  <div className="text-sm">{m.notes}</div>
                  <div className="text-xs text-muted-foreground">Diagnosed: {m.diagnosisDate}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {baseClient.sessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions found.</p>
          ) : (
            <div className="space-y-4">
              {baseClient.sessions.map((s) => {
                const sessionNote = notes.find(n => new Date(n.date).toDateString() === new Date(s.date).toDateString());
                return (
                  <Card key={s.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 px-3 py-1 rounded-md">
                            <span className="text-sm font-medium text-gray-900">Session {s.id}</span>
                          </div>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{s.id}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Dr. Emily White</div>
                          <div className="text-sm text-muted-foreground">{formatDate(s.date)} at {s.time}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {sessionNote ? sessionNote.summary : "No notes available for this session."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {s.type}
                          </Badge>
                          {sessionNote?.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {sessionNote && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                View Full Note
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Session Note - {s.id}</DialogTitle>
                                <DialogDescription>
                                  Dr. Emily White • {formatDate(s.date)} at {s.time}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Session Type</h4>
                                  <Badge variant="secondary">{s.type}</Badge>
                                </div>
                                
                                {sessionNote.tags && (
                                  <div>
                                    <h4 className="font-medium mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {sessionNote.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="font-medium mb-2">Session Summary</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {sessionNote.summary}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


