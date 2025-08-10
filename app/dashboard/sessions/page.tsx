import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { FileText } from "lucide-react"

export default function SessionsPage() {
  // Default data in case imports are not available during build
  const sessionNotes = [
    {
      id: "SN-2024-001",
      sessionId: "SES-2024-001",
      date: "2024-09-15",
      therapist: "Dr. Emily White",
      summary: "Initial assessment session. Patient presented with symptoms of anxiety and stress related to work pressure. Discussed coping mechanisms and established treatment goals. Patient showed good engagement and willingness to work on identified issues.",
      therapyType: "Cognitive Behavioral Therapy",
      tags: ["Anxiety", "Stress Management", "CBT"]
    },
    {
      id: "SN-2024-002", 
      sessionId: "SES-2024-002",
      date: "2024-09-22",
      therapist: "Dr. Emily White",
      summary: "Follow-up session focusing on cognitive restructuring. Patient reported improved sleep patterns and reduced anxiety levels. Introduced mindfulness techniques and breathing exercises. Homework assigned for daily practice.",
      therapyType: "Mindfulness-Based Therapy",
      tags: ["Mindfulness", "Breathing Exercises", "Sleep Improvement"]
    },
    {
      id: "SN-2024-003",
      sessionId: "SES-2024-003", 
      date: "2024-09-29",
      therapist: "Dr. Sarah Johnson",
      summary: "Session focused on interpersonal relationships and communication skills. Patient expressed concerns about work relationships. Explored assertiveness training and boundary setting. Good progress noted in applying previous techniques.",
      therapyType: "Interpersonal Therapy",
      tags: ["Communication", "Assertiveness", "Boundaries"]
    }
  ]

  const format = (date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session Notes</h2>

      <div className="space-y-4">
        {sessionNotes.map((note) => (
          <Card key={note.id} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 px-3 py-1 rounded-md">
                    <span className="text-sm font-medium text-gray-900">Session {note.sessionId.split("-")[2]}</span>
                  </div>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{note.sessionId}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{note.therapist}</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(note.date), "PPP")}</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{note.summary}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {note.therapyType}
                  </Badge>
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Session Note - {note.sessionId}</DialogTitle>
                      <DialogDescription>
                        {note.therapist} • {format(new Date(note.date), "PPP")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Therapy Type</h4>
                        <Badge variant="secondary">{note.therapyType}</Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {note.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Session Summary</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {note.summary}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
