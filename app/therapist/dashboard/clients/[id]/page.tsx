'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, FileText, Stethoscope, Pill, User, Loader2 } from "lucide-react"
import { useTherapistUser } from "@/context/therapist-user-context"

function formatDate(input: string) {
  return new Date(input).toLocaleDateString()
}

export default function TherapistClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { therapistUser } = useTherapistUser()
  const [clientData, setClientData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!therapistUser?.id || !id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/therapist/clients?therapistId=${therapistUser.id}&clientId=${id}`)
        const data = await response.json()
        
        if (data.client) {
          setClientData(data.client)
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Error fetching client data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [therapistUser?.id, id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/therapist/dashboard/clients">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading client data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/therapist/dashboard/clients">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Client not found</p>
        </div>
      </div>
    )
  }

  const totalSessions = clientData.totalSessions
  const completedSessions = clientData.completedSessions
  const upcomingSessions = clientData.upcomingSessions
  const amountEarned = `₦${clientData.amountEarned.toLocaleString()}`
  const hasUpcoming = upcomingSessions > 0

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
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{clientData.name}</h1>
            <p className="text-sm text-muted-foreground">Last seen {clientData.lastSeen}</p>
            <p className="text-sm text-muted-foreground">{clientData.email}</p>
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
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{completedSessions}</div>
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
          {clientData.medicalHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical history recorded yet.</p>
              <p className="text-sm">Click "Manage Medical History" to add diagnoses and medications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientData.medicalHistory.map((m: any, idx: number) => (
                <div key={idx} className="p-3 rounded-md bg-muted/40">
                  <div className="font-medium">{m.condition}</div>
                  <div className="text-sm">{m.notes}</div>
                  <div className="text-xs text-muted-foreground">Diagnosed: {formatDate(m.diagnosis_date)}</div>
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
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <Card key={s.id} className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 px-3 py-1 rounded-md">
                          <span className="text-sm font-medium text-gray-900">Session #{s.id}</span>
                        </div>
                        <Badge variant={s.status === 'completed' ? 'default' : s.status === 'scheduled' ? 'secondary' : 'outline'}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{clientData.name}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(s.created_at)}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {s.notes || "No notes available for this session."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {s.session_type || 'Individual'}
                        </Badge>
                        {s.session_duration && (
                          <Badge variant="outline" className="text-xs">
                            {s.session_duration} min
                          </Badge>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


