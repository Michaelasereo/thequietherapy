'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Loader2, Stethoscope } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  PatientMedicalHistory,
  getPatientMedicalHistory,
  addPatientMedicalHistory,
  updatePatientMedicalHistory,
  getCurrentUserId
} from "@/lib/client-data"
import { toast } from "sonner"

interface PatientMedicalHistoryEditorProps {
  userId: string
  readOnly?: boolean
}

export default function PatientMedicalHistoryEditor({ userId, readOnly = false }: PatientMedicalHistoryEditorProps) {
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [therapistId, setTherapistId] = useState<string | null>(null)
  
  const [isAddingMedical, setIsAddingMedical] = useState(false)
  const [editingMedicalId, setEditingMedicalId] = useState<string | null>(null)
  const [medicalForm, setMedicalForm] = useState({
    condition: '',
    diagnosis_date: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const currentTherapistId = await getCurrentUserId()
      if (!currentTherapistId) {
        throw new Error('Therapist not authenticated')
      }

      const medical = await getPatientMedicalHistory(userId)
      setMedicalHistory(medical)
      setTherapistId(currentTherapistId)
    } catch (error) {
      console.error('Error loading medical history:', error)
      toast.error('Failed to load medical history')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedicalHistory = async () => {
    if (!therapistId || !medicalForm.condition || !medicalForm.diagnosis_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const newMedical = await addPatientMedicalHistory(userId, therapistId, {
        condition: medicalForm.condition,
        diagnosis_date: medicalForm.diagnosis_date,
        notes: medicalForm.notes
      })
      
      if (newMedical) {
        setMedicalHistory(prev => [newMedical, ...prev])
        setMedicalForm({ condition: '', diagnosis_date: '', notes: '' })
        setIsAddingMedical(false)
        toast.success('Medical history added successfully')
      }
    } catch (error) {
      console.error('Error adding medical history:', error)
      toast.error('Failed to add medical history')
    }
  }

  const handleEditMedicalHistory = (item: PatientMedicalHistory) => {
    setEditingMedicalId(item.id!)
    setMedicalForm({
      condition: item.condition,
      diagnosis_date: item.diagnosis_date,
      notes: item.notes || ''
    })
  }

  const handleUpdateMedicalHistory = async () => {
    if (!editingMedicalId || !medicalForm.condition || !medicalForm.diagnosis_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const updated = await updatePatientMedicalHistory(editingMedicalId, {
        condition: medicalForm.condition,
        diagnosis_date: medicalForm.diagnosis_date,
        notes: medicalForm.notes
      })

      if (updated) {
        setMedicalHistory(prev => prev.map(item => 
          item.id === editingMedicalId ? updated : item
        ))
        setEditingMedicalId(null)
        setMedicalForm({ condition: '', diagnosis_date: '', notes: '' })
        toast.success('Medical history updated successfully')
      }
    } catch (error) {
      console.error('Error updating medical history:', error)
      toast.error('Failed to update medical history')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading medical history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!readOnly && therapistId && (
        <div className="flex justify-end">
          <Dialog open={isAddingMedical} onOpenChange={setIsAddingMedical}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Diagnosis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medical Diagnosis</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Input
                    id="condition"
                    value={medicalForm.condition}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, condition: e.target.value }))}
                    placeholder="e.g., Generalized Anxiety Disorder"
                  />
                </div>
                <div>
                  <Label htmlFor="diagnosis_date">Diagnosis Date *</Label>
                  <Input
                    id="diagnosis_date"
                    type="date"
                    value={medicalForm.diagnosis_date}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, diagnosis_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="medical_notes">Notes</Label>
                  <Textarea
                    id="medical_notes"
                    value={medicalForm.notes}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the diagnosis..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddMedicalHistory} className="flex-1">
                    Add Diagnosis
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingMedical(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {medicalHistory.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condition</TableHead>
                <TableHead>Diagnosis Date</TableHead>
                <TableHead>Notes</TableHead>
                {!readOnly && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicalHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.condition}</TableCell>
                  <TableCell>{formatDate(item.diagnosis_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.notes || "No notes"}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditMedicalHistory(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No medical diagnoses recorded yet.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingMedicalId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingMedicalId(null)
          setMedicalForm({ condition: '', diagnosis_date: '', notes: '' })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medical Diagnosis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_condition">Condition *</Label>
              <Input
                id="edit_condition"
                value={medicalForm.condition}
                onChange={(e) => setMedicalForm(prev => ({ ...prev, condition: e.target.value }))}
                placeholder="e.g., Generalized Anxiety Disorder"
              />
            </div>
            <div>
              <Label htmlFor="edit_diagnosis_date">Diagnosis Date *</Label>
              <Input
                id="edit_diagnosis_date"
                type="date"
                value={medicalForm.diagnosis_date}
                onChange={(e) => setMedicalForm(prev => ({ ...prev, diagnosis_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_medical_notes">Notes</Label>
              <Textarea
                id="edit_medical_notes"
                value={medicalForm.notes}
                onChange={(e) => setMedicalForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the diagnosis..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateMedicalHistory} className="flex-1">
                Update Diagnosis
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingMedicalId(null)
                setMedicalForm({ condition: '', diagnosis_date: '', notes: '' })
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

