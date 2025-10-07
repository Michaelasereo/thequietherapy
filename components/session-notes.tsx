'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  User, 
  Brain, 
  Clock, 
  CheckCircle, 
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface SOAPNotes {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SessionNotesData {
  notes?: string
  therapist_notes?: string
  patient_notes?: string
  soap_notes?: SOAPNotes
  transcript?: string
  ai_generated?: boolean
  ai_notes_generated_at?: string
}

interface SessionNotesProps {
  sessionId: string
  userType: 'patient' | 'therapist'
  onNotesSaved?: () => void
}

export default function SessionNotes({ sessionId, userType, onNotesSaved }: SessionNotesProps) {
  const [sessionData, setSessionData] = useState<any>(null)
  const [notesData, setNotesData] = useState<SessionNotesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingSOAP, setGeneratingSOAP] = useState(false)
  
  // Form state
  const [patientNotes, setPatientNotes] = useState('')
  const [therapistNotes, setTherapistNotes] = useState('')
  const [soapNotes, setSoapNotes] = useState<SOAPNotes | null>(null)

  useEffect(() => {
    fetchSessionNotes()
  }, [sessionId])

  const fetchSessionNotes = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        setSessionData(result.session)
        setNotesData(result.notes)
        
        // Populate form fields
        if (result.notes) {
          setPatientNotes(result.notes.patient_notes || '')
          setTherapistNotes(result.notes.therapist_notes || '')
          if (result.notes.soap_notes) {
            setSoapNotes(result.notes.soap_notes)
          }
        }
      } else {
        console.error('Error fetching session notes:', result.error)
        toast.error('Failed to load session notes')
      }
    } catch (error) {
      console.error('Error fetching session notes:', error)
      toast.error('Failed to load session notes')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    try {
      setSaving(true)
      
      const notesToSave: any = {}
      
      if (userType === 'patient') {
        notesToSave.patientNotes = patientNotes
      } else {
        notesToSave.therapistNotes = therapistNotes
      }
      
      const response = await fetch('/api/sessions/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...notesToSave
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Notes saved successfully')
        onNotesSaved?.()
      } else {
        console.error('Error saving notes:', result.error)
        toast.error('Failed to save notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const generateSOAPNotes = async () => {
    try {
      setGeneratingSOAP(true)
      
      // Get transcript if available
      const transcript = notesData?.transcript || ''
      
      const response = await fetch('/api/sessions/soap-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcript
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSoapNotes(result.soapNotes)
        toast.success('SOAP notes generated successfully')
      } else {
        console.error('Error generating SOAP notes:', result.error)
        toast.error('Failed to generate SOAP notes')
      }
    } catch (error) {
      console.error('Error generating SOAP notes:', error)
      toast.error('Failed to generate SOAP notes')
    } finally {
      setGeneratingSOAP(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading session notes...</span>
        </CardContent>
      </Card>
    )
  }

  if (!sessionData) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Session not found or access denied.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Patient</Label>
              <p className="font-medium">{sessionData.users?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <Label className="text-gray-600">Therapist</Label>
              <p className="font-medium">{sessionData.therapist?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <Label className="text-gray-600">Duration</Label>
              <p className="font-medium">{sessionData.duration || 30} minutes</p>
            </div>
            <div>
              <Label className="text-gray-600">Type</Label>
              <Badge variant="outline" className="capitalize">
                {sessionData.session_type || 'individual'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Tabs */}
      <Tabs defaultValue={userType === 'patient' ? 'patient' : 'therapist'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patient">Patient Notes</TabsTrigger>
          <TabsTrigger value="therapist">Therapist Notes</TabsTrigger>
          <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
        </TabsList>
        
        {/* Patient Notes */}
        <TabsContent value="patient" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient-notes">Your Session Notes</Label>
                <Textarea
                  id="patient-notes"
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Add your thoughts and notes about the session..."
                  rows={8}
                  className="mt-1"
                  disabled={userType !== 'patient'}
                />
              </div>
              
              {userType === 'patient' && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotes} 
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Save Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Therapist Notes */}
        <TabsContent value="therapist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Therapist Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="therapist-notes">Clinical Notes</Label>
                <Textarea
                  id="therapist-notes"
                  value={therapistNotes}
                  onChange={(e) => setTherapistNotes(e.target.value)}
                  placeholder="Add clinical observations and treatment notes..."
                  rows={8}
                  className="mt-1"
                  disabled={userType !== 'therapist'}
                />
              </div>
              
              {userType === 'therapist' && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotes} 
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Save Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOAP Notes */}
        <TabsContent value="soap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  SOAP Notes
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {soapNotes ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Subjective</Label>
                    <Textarea 
                      value={soapNotes.subjective} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Objective</Label>
                    <Textarea 
                      value={soapNotes.objective} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assessment</Label>
                    <Textarea 
                      value={soapNotes.assessment} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Plan</Label>
                    <Textarea 
                      value={soapNotes.plan} 
                      readOnly 
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  {notesData?.ai_notes_generated_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Generated on {new Date(notesData.ai_notes_generated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {notesData?.transcript 
                      ? 'AI-generated SOAP notes will be created from the session transcript'
                      : 'No transcript available. SOAP notes require a session recording.'
                    }
                  </p>
                  <Button 
                    onClick={generateSOAPNotes} 
                    disabled={generatingSOAP || !notesData?.transcript}
                    className="flex items-center gap-2"
                  >
                    {generatingSOAP ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    Generate SOAP Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
