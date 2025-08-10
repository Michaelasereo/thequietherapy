"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { sessionNotes } from "@/lib/data"
import { FileText } from "lucide-react"

export default function SessionsPage() {
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
