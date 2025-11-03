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
  AlertCircle,
  Stethoscope,
  Pill
} from "lucide-react"
import { toast } from "sonner"
import SOAPNotesDisplay from '@/components/soap-notes-display'
import PatientMedicalHistoryEditor from '@/components/patient-medical-history-editor'
import PatientDrugHistoryEditor from '@/components/patient-drug-history-editor'

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
    if (sessionId) {
      fetchSessionNotes()
    } else {
      console.warn('⚠️ SessionNotes: sessionId is null, skipping fetch')
      setLoading(false)
    }
  }, [sessionId])

  const fetchSessionNotes = async () => {
    if (!sessionId) {
      console.error('❌ SessionNotes: Cannot fetch notes without sessionId')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/notes?sessionId=${sessionId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSessionData(result.session)
        setNotesData(result.notes)
        
        // Populate form fields
        if (result.notes) {
          // Get notes from the 'notes' column (since therapist_notes/patient_notes columns don't exist)
          // The 'notes' column contains therapist notes
          // Try to get separate columns first if they exist, otherwise use 'notes' column
          const therapistNotesValue = result.notes.therapist_notes || result.notes.notes || ''
          const patientNotesValue = result.notes.patient_notes || ''
          
          setTherapistNotes(therapistNotesValue)
          setPatientNotes(patientNotesValue)
          
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
        // For therapist notes, append with timestamp
        const timestamp = new Date().toISOString()
        const newNoteEntry = therapistNotes.trim()
        
        if (!newNoteEntry) {
          toast.error('Please enter some notes before saving')
          return
        }
        
        // Get existing notes
        const existingNotes = notesData?.notes || ''
        // Append new note with timestamp separator
        const separator = existingNotes ? '\n\n---\n\n' : ''
        const timestampedNote = `${timestamp} - ${newNoteEntry}`
        notesToSave.notes = existingNotes + separator + timestampedNote
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
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to save notes'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          console.error('❌ Error saving notes:', {
            status: response.status,
            error: errorData.error,
            details: errorData.details,
            code: errorData.code,
            hint: errorData.hint
          })
        } catch {
          const errorText = await response.text()
          console.error('❌ Error saving notes (non-JSON response):', {
            status: response.status,
            text: errorText
          })
          errorMessage = errorText || errorMessage
        }
        toast.error(errorMessage)
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Notes saved successfully')
        // Clear the input field after saving
        if (userType === 'therapist') {
          setTherapistNotes('')
        } else {
          setPatientNotes('')
        }
        // Refresh notes to show the new entry
        await fetchSessionNotes()
        onNotesSaved?.()
      } else {
        console.error('❌ Error saving notes:', result.error, result.details)
        toast.error(result.error || 'Failed to save notes')
      }
    } catch (error) {
      console.error('❌ Error saving notes:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save notes'
      toast.error(errorMessage)
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
        // Handle both object and string formats
        if (typeof result.soapNotes === 'object' && result.soapNotes !== null) {
          setSoapNotes(result.soapNotes)
        } else if (typeof result.soapNotes === 'string') {
          try {
            const parsed = JSON.parse(result.soapNotes)
            setSoapNotes(parsed)
          } catch {
            // If it's not JSON, create a simple structure
            setSoapNotes({
              subjective: result.soapNotes,
              objective: '',
              assessment: '',
              plan: ''
            })
          }
        }
        
        // Refresh notes data to get updated SOAP notes from server
        await fetchSessionNotes()
        
        toast.success('SOAP notes generated successfully!')
      } else {
        console.error('Error generating SOAP notes:', result.error)
        toast.error(result.error || 'Failed to generate SOAP notes')
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
        <TabsList className={userType === 'therapist' ? 'grid w-full grid-cols-5' : 'grid w-full grid-cols-3'}>
          <TabsTrigger value="patient">Patient Notes</TabsTrigger>
          <TabsTrigger value="therapist">Therapist Notes</TabsTrigger>
          <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
          {userType === 'therapist' && (
            <>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="drug">Drug History</TabsTrigger>
            </>
          )}
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
              {/* Display existing notes separated by timestamps */}
              {notesData?.notes && notesData.notes.trim() && (
                <div className="space-y-4 mb-4">
                  <Label>Previous Therapy Notes</Label>
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    {(() => {
                      // Split notes by separator (--- or new line pattern with timestamp)
                      const notesArray = notesData.notes.split(/---|\n\n(?=\d{4}-\d{2}-\d{2})/).filter(n => n.trim());
                      
                      return notesArray.map((noteBlock, index) => {
                        // Try to extract timestamp if present (ISO format: 2024-01-01T12:00:00.000Z or 2024-01-01 12:00:00)
                        const timestampMatch = noteBlock.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z)?)/);
                        const timestamp = timestampMatch ? timestampMatch[1] : null;
                        const noteText = timestamp 
                          ? noteBlock.replace(/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z)?[\s\n]*-?[\s\n]*/, '').trim() 
                          : noteBlock.trim();
                        
                        if (!noteText) return null;
                        
                        return (
                          <div key={index} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                            {timestamp && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(timestamp).toLocaleString()}</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{noteText}</p>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                </div>
              )}
              
              {(!notesData?.notes || !notesData.notes.trim()) && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border mb-4">
                  <p className="text-sm text-gray-500">No therapy notes yet. Add your first note below.</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="therapist-notes">Add New Clinical Notes</Label>
                <Textarea
                  id="therapist-notes"
                  value={therapistNotes}
                  onChange={(e) => setTherapistNotes(e.target.value)}
                  placeholder="Add clinical observations and treatment notes..."
                  rows={8}
                  className="mt-1"
                  disabled={userType !== 'therapist'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  New notes will be appended with a timestamp
                </p>
              </div>
              
              {userType === 'therapist' && (
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={handleSaveNotes} 
                    disabled={saving || !therapistNotes.trim()}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Add Notes
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
                  <SOAPNotesDisplay soapNotes={soapNotes} />
                  
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

        {/* Medical History Tab - Therapist Only */}
        {userType === 'therapist' && sessionData?.user_id && (
          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatientMedicalHistoryEditor userId={sessionData.user_id} readOnly={false} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Drug History Tab - Therapist Only */}
        {userType === 'therapist' && sessionData?.user_id && (
          <TabsContent value="drug" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Drug History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatientDrugHistoryEditor userId={sessionData.user_id} readOnly={false} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
