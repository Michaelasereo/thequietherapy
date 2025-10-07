'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Save, 
  FileText, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

interface SessionNotesPanelProps {
  sessionId: string
}

interface SessionNote {
  id?: string
  session_id?: string
  therapist_id?: string
  user_id?: string
  notes?: string
  mood_rating?: number
  progress_notes?: string
  homework_assigned?: string
  next_session_focus?: string
  ai_generated?: boolean
  transcript?: string
  soap_subjective?: string
  soap_objective?: string
  soap_assessment?: string
  soap_plan?: string
  therapeutic_insights?: any
  created_at?: string
  updated_at?: string
}

export default function SessionNotesPanel({ sessionId }: SessionNotesPanelProps) {
  const [notes, setNotes] = useState<SessionNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    loadSessionNotes()
  }, [sessionId])

  const loadSessionNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessions/${sessionId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
        if (data.notes?.ai_generated) {
          setShowAI(true)
        }
      }
    } catch (error) {
      console.error('Error loading session notes:', error)
      toast.error('Failed to load session notes')
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async () => {
    try {
      setSaving(true)
      const notesData = {
        notes: notes?.notes || '',
        mood_rating: notes?.mood_rating || 5,
        progress_notes: notes?.progress_notes || '',
        homework_assigned: notes?.homework_assigned || '',
        next_session_focus: notes?.next_session_focus || ''
      }

      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notesData)
      })

      if (response.ok) {
        toast.success('Session notes saved successfully')
        await loadSessionNotes() // Reload to get updated data
      } else {
        toast.error('Failed to save session notes')
      }
    } catch (error) {
      console.error('Error saving session notes:', error)
      toast.error('Error saving session notes')
    } finally {
      setSaving(false)
    }
  }

  const startAIProcessing = async () => {
    try {
      setAiProcessing(true)
      const response = await fetch(`/api/sessions/${sessionId}/ai-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start'
        })
      })

      if (response.ok) {
        toast.success('AI processing started')
        // Poll for completion
        pollAIProcessingStatus()
      } else {
        toast.error('Failed to start AI processing')
      }
    } catch (error) {
      console.error('Error starting AI processing:', error)
      toast.error('Error starting AI processing')
    } finally {
      setAiProcessing(false)
    }
  }

  const pollAIProcessingStatus = async () => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/ai-process`)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'completed') {
            toast.success('AI processing completed!')
            await loadSessionNotes()
            setShowAI(true)
            return
          } else if (data.status === 'error') {
            toast.error('AI processing failed')
            return
          }
          // Continue polling
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error('Error checking AI status:', error)
      }
    }
    checkStatus()
  }

  if (loading) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Session Notes</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-white">Session Notes</h3>
        <div className="flex items-center gap-2">
          {notes?.ai_generated && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={saveNotes}
            disabled={saving}
            className="text-white hover:bg-gray-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Processing Status */}
        {aiProcessing && (
          <Card className="bg-blue-900/20 border-blue-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI processing session notes...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Notes Section */}
        <div>
          <Label className="text-sm text-gray-300">Session Notes</Label>
          <Textarea
            value={notes?.notes || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter session notes..."
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            rows={4}
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-300">Progress Notes</Label>
          <Textarea
            value={notes?.progress_notes || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, progress_notes: e.target.value }))}
            placeholder="Patient progress and observations..."
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            rows={3}
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-300">Homework Assigned</Label>
          <Textarea
            value={notes?.homework_assigned || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, homework_assigned: e.target.value }))}
            placeholder="Assignments for next session..."
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            rows={2}
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-300">Next Session Focus</Label>
          <Textarea
            value={notes?.next_session_focus || ''}
            onChange={(e) => setNotes(prev => ({ ...prev, next_session_focus: e.target.value }))}
            placeholder="Topics to focus on next session..."
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            rows={2}
          />
        </div>

        {/* AI-Generated Content */}
        {showAI && notes?.ai_generated && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">AI Analysis</span>
            </div>

            {/* SOAP Notes */}
            {notes.soap_subjective && (
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-gray-300">SOAP Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-blue-300">Subjective:</span>
                    <p className="text-gray-300 mt-1">{notes.soap_subjective}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-300">Objective:</span>
                    <p className="text-gray-300 mt-1">{notes.soap_objective}</p>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-300">Assessment:</span>
                    <p className="text-gray-300 mt-1">{notes.soap_assessment}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-300">Plan:</span>
                    <p className="text-gray-300 mt-1">{notes.soap_plan}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Therapeutic Insights */}
            {notes.therapeutic_insights && (
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-gray-300">Therapeutic Insights</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-green-300">Breakthroughs:</span>
                    <ul className="text-gray-300 mt-1 list-disc list-inside">
                      {notes.therapeutic_insights.breakthroughs?.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-orange-300">Concerns:</span>
                    <ul className="text-gray-300 mt-1 list-disc list-inside">
                      {notes.therapeutic_insights.concerns?.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-blue-300">Relationship:</span>
                    <p className="text-gray-300 mt-1">{notes.therapeutic_insights.therapeutic_relationship}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-300">Progress:</span>
                    <p className="text-gray-300 mt-1">{notes.therapeutic_insights.treatment_progress}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
