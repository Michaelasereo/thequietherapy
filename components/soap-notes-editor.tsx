'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save, 
  FileText, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  Stethoscope,
  Target,
  ClipboardList,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

interface SOAPNotesEditorProps {
  sessionId: string
  therapistId: string
  patientId: string
  onSave?: (notes: SOAPNotes) => void
}

interface SOAPNotes {
  id?: string
  session_id: string
  therapist_id: string
  patient_id: string
  
  // SOAP Components
  subjective: {
    chief_complaint: string
    history_of_present_illness: string
    past_psychiatric_history: string
    family_history: string
    social_history: string
    current_medications: string
    allergies: string
    review_of_systems: string
  }
  
  objective: {
    mental_status_examination: {
      appearance: string
      behavior: string
      mood: string
      affect: string
      speech: string
      thought_process: string
      thought_content: string
      perception: string
      cognition: string
      insight: string
      judgment: string
    }
    physical_examination: string
    laboratory_findings: string
    assessment_tools: string
  }
  
  assessment: {
    primary_diagnosis: string
    differential_diagnosis: string[]
    risk_assessment: {
      suicide_risk: 'low' | 'moderate' | 'high'
      violence_risk: 'low' | 'moderate' | 'high'
      self_harm_risk: 'low' | 'moderate' | 'high'
      notes: string
    }
    clinical_impression: string
    progress_notes: string
  }
  
  plan: {
    treatment_goals: string[]
    interventions_used: string[]
    homework_assigned: string
    medication_changes: string
    referrals: string
    follow_up_plan: string
    next_session_focus: string
    crisis_plan: string
  }
  
  // Additional fields
  session_rating: number
  therapeutic_alliance_rating: number
  patient_engagement: number
  treatment_compliance: number
  notes: string
  ai_generated: boolean
  created_at?: string
  updated_at?: string
}

const defaultSOAPNotes: SOAPNotes = {
  session_id: '',
  therapist_id: '',
  patient_id: '',
  subjective: {
    chief_complaint: '',
    history_of_present_illness: '',
    past_psychiatric_history: '',
    family_history: '',
    social_history: '',
    current_medications: '',
    allergies: '',
    review_of_systems: ''
  },
  objective: {
    mental_status_examination: {
      appearance: '',
      behavior: '',
      mood: '',
      affect: '',
      speech: '',
      thought_process: '',
      thought_content: '',
      perception: '',
      cognition: '',
      insight: '',
      judgment: ''
    },
    physical_examination: '',
    laboratory_findings: '',
    assessment_tools: ''
  },
  assessment: {
    primary_diagnosis: '',
    differential_diagnosis: [],
    risk_assessment: {
      suicide_risk: 'low',
      violence_risk: 'low',
      self_harm_risk: 'low',
      notes: ''
    },
    clinical_impression: '',
    progress_notes: ''
  },
  plan: {
    treatment_goals: [],
    interventions_used: [],
    homework_assigned: '',
    medication_changes: '',
    referrals: '',
    follow_up_plan: '',
    next_session_focus: '',
    crisis_plan: ''
  },
  session_rating: 5,
  therapeutic_alliance_rating: 5,
  patient_engagement: 5,
  treatment_compliance: 5,
  notes: '',
  ai_generated: false
}

export default function SOAPNotesEditor({ 
  sessionId, 
  therapistId, 
  patientId, 
  onSave 
}: SOAPNotesEditorProps) {
  const [notes, setNotes] = useState<SOAPNotes>(defaultSOAPNotes)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadSOAPNotes()
  }, [sessionId])

  const loadSOAPNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessions/${sessionId}/soap-notes`)
      if (response.ok) {
        const data = await response.json()
        if (data.notes) {
          setNotes(data.notes)
          setIsEditing(false)
        } else {
          // Initialize with default values
          setNotes({
            ...defaultSOAPNotes,
            session_id: sessionId,
            therapist_id: therapistId,
            patient_id: patientId
          })
          setIsEditing(true)
        }
      }
    } catch (error) {
      console.error('Error loading SOAP notes:', error)
      toast.error('Failed to load SOAP notes')
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/sessions/${sessionId}/soap-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notes)
      })

      if (response.ok) {
        toast.success('SOAP notes saved successfully')
        setIsEditing(false)
        onSave?.(notes)
      } else {
        toast.error('Failed to save SOAP notes')
      }
    } catch (error) {
      console.error('Error saving SOAP notes:', error)
      toast.error('Failed to save SOAP notes')
    } finally {
      setSaving(false)
    }
  }

  const generateAINotes = async () => {
    try {
      setAiProcessing(true)
      const response = await fetch(`/api/sessions/${sessionId}/ai-soap-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotes(prev => ({
          ...prev,
          ...data.notes,
          ai_generated: true
        }))
        toast.success('AI-generated SOAP notes created')
      } else {
        toast.error('Failed to generate AI notes')
      }
    } catch (error) {
      console.error('Error generating AI notes:', error)
      toast.error('Failed to generate AI notes')
    } finally {
      setAiProcessing(false)
    }
  }

  const updateField = (section: string, field: string, value: any) => {
    setNotes(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof SOAPNotes] as any),
        [field]: value
      }
    }))
  }

  const updateNestedField = (section: string, subsection: string, field: string, value: any) => {
    setNotes(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof SOAPNotes] as any),
        [subsection]: {
          ...(prev[section as keyof SOAPNotes] as any)[subsection],
          [field]: value
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading SOAP notes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          <h2 className="text-xl font-semibold">SOAP Notes</h2>
          {notes.ai_generated && (
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button 
            onClick={generateAINotes} 
            disabled={aiProcessing}
            variant="outline"
          >
            {aiProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Generate AI Notes
          </Button>
          {isEditing && (
            <Button onClick={saveNotes} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Notes
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="subjective" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subjective">Subjective</TabsTrigger>
          <TabsTrigger value="objective">Objective</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="subjective" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subjective</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chief Complaint</Label>
                <Textarea
                  value={notes.subjective.chief_complaint}
                  onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Patient's main concern..."
                />
              </div>
              
              <div>
                <Label>History of Present Illness</Label>
                <Textarea
                  value={notes.subjective.history_of_present_illness}
                  onChange={(e) => updateField('subjective', 'history_of_present_illness', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Detailed history of current symptoms..."
                />
              </div>
              
              <div>
                <Label>Past Psychiatric History</Label>
                <Textarea
                  value={notes.subjective.past_psychiatric_history}
                  onChange={(e) => updateField('subjective', 'past_psychiatric_history', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Previous mental health treatment..."
                />
              </div>
              
              <div>
                <Label>Family History</Label>
                <Textarea
                  value={notes.subjective.family_history}
                  onChange={(e) => updateField('subjective', 'family_history', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Family mental health history..."
                />
              </div>
              
              <div>
                <Label>Social History</Label>
                <Textarea
                  value={notes.subjective.social_history}
                  onChange={(e) => updateField('subjective', 'social_history', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Social context, relationships, work..."
                />
              </div>
              
              <div>
                <Label>Current Medications</Label>
                <Textarea
                  value={notes.subjective.current_medications}
                  onChange={(e) => updateField('subjective', 'current_medications', e.target.value)}
                  disabled={!isEditing}
                  placeholder="List current medications..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objective" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objective</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mental Status Examination</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Appearance</Label>
                    <Textarea
                      value={notes.objective.mental_status_examination.appearance}
                      onChange={(e) => updateNestedField('objective', 'mental_status_examination', 'appearance', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Physical appearance..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Behavior</Label>
                    <Textarea
                      value={notes.objective.mental_status_examination.behavior}
                      onChange={(e) => updateNestedField('objective', 'mental_status_examination', 'behavior', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Behavioral observations..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Mood</Label>
                    <Textarea
                      value={notes.objective.mental_status_examination.mood}
                      onChange={(e) => updateNestedField('objective', 'mental_status_examination', 'mood', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Patient's reported mood..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Affect</Label>
                    <Textarea
                      value={notes.objective.mental_status_examination.affect}
                      onChange={(e) => updateNestedField('objective', 'mental_status_examination', 'affect', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Observed emotional expression..."
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Physical Examination</Label>
                <Textarea
                  value={notes.objective.physical_examination}
                  onChange={(e) => updateField('objective', 'physical_examination', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Physical examination findings..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Diagnosis</Label>
                <Textarea
                  value={notes.assessment.primary_diagnosis}
                  onChange={(e) => updateField('assessment', 'primary_diagnosis', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Primary diagnosis..."
                />
              </div>
              
              <div>
                <Label>Clinical Impression</Label>
                <Textarea
                  value={notes.assessment.clinical_impression}
                  onChange={(e) => updateField('assessment', 'clinical_impression', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Clinical impression and formulation..."
                />
              </div>
              
              <div>
                <Label>Risk Assessment</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Suicide Risk</Label>
                    <select
                      value={notes.assessment.risk_assessment.suicide_risk}
                      onChange={(e) => updateNestedField('assessment', 'risk_assessment', 'suicide_risk', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm">Violence Risk</Label>
                    <select
                      value={notes.assessment.risk_assessment.violence_risk}
                      onChange={(e) => updateNestedField('assessment', 'risk_assessment', 'violence_risk', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm">Self-Harm Risk</Label>
                    <select
                      value={notes.assessment.risk_assessment.self_harm_risk}
                      onChange={(e) => updateNestedField('assessment', 'risk_assessment', 'self_harm_risk', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <Textarea
                  value={notes.assessment.risk_assessment.notes}
                  onChange={(e) => updateNestedField('assessment', 'risk_assessment', 'notes', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Risk assessment notes..."
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Treatment Goals</Label>
                <Textarea
                  value={notes.plan.treatment_goals.join('\n')}
                  onChange={(e) => updateField('plan', 'treatment_goals', e.target.value.split('\n').filter(goal => goal.trim()))}
                  disabled={!isEditing}
                  placeholder="List treatment goals (one per line)..."
                />
              </div>
              
              <div>
                <Label>Interventions Used</Label>
                <Textarea
                  value={notes.plan.interventions_used.join('\n')}
                  onChange={(e) => updateField('plan', 'interventions_used', e.target.value.split('\n').filter(intervention => intervention.trim()))}
                  disabled={!isEditing}
                  placeholder="List interventions used (one per line)..."
                />
              </div>
              
              <div>
                <Label>Homework Assigned</Label>
                <Textarea
                  value={notes.plan.homework_assigned}
                  onChange={(e) => updateField('plan', 'homework_assigned', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Homework assignments..."
                />
              </div>
              
              <div>
                <Label>Next Session Focus</Label>
                <Textarea
                  value={notes.plan.next_session_focus}
                  onChange={(e) => updateField('plan', 'next_session_focus', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Focus areas for next session..."
                />
              </div>
              
              <div>
                <Label>Crisis Plan</Label>
                <Textarea
                  value={notes.plan.crisis_plan}
                  onChange={(e) => updateField('plan', 'crisis_plan', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Crisis intervention plan..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Session Rating (1-10)</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={notes.session_rating}
                onChange={(e) => setNotes(prev => ({ ...prev, session_rating: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{notes.session_rating}/10</span>
            </div>
            <div>
              <Label>Therapeutic Alliance (1-10)</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={notes.therapeutic_alliance_rating}
                onChange={(e) => setNotes(prev => ({ ...prev, therapeutic_alliance_rating: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{notes.therapeutic_alliance_rating}/10</span>
            </div>
            <div>
              <Label>Patient Engagement (1-10)</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={notes.patient_engagement}
                onChange={(e) => setNotes(prev => ({ ...prev, patient_engagement: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{notes.patient_engagement}/10</span>
            </div>
            <div>
              <Label>Treatment Compliance (1-10)</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={notes.treatment_compliance}
                onChange={(e) => setNotes(prev => ({ ...prev, treatment_compliance: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{notes.treatment_compliance}/10</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
