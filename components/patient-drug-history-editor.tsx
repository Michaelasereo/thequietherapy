'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Loader2, Pill } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  PatientDrugHistory,
  getPatientDrugHistory,
  addPatientDrugHistory,
  updatePatientDrugHistory,
  getCurrentUserId
} from "@/lib/client-data"
import { toast } from "sonner"

interface PatientDrugHistoryEditorProps {
  userId: string
  readOnly?: boolean
}

export default function PatientDrugHistoryEditor({ userId, readOnly = false }: PatientDrugHistoryEditorProps) {
  const [drugHistory, setDrugHistory] = useState<PatientDrugHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [therapistId, setTherapistId] = useState<string | null>(null)
  
  const [isAddingDrug, setIsAddingDrug] = useState(false)
  const [editingDrugId, setEditingDrugId] = useState<string | null>(null)
  const [drugForm, setDrugForm] = useState({
    medication_name: '',
    dosage: '',
    start_date: '',
    prescribing_doctor: '',
    notes: '',
    duration_of_usage: ''
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

      const drug = await getPatientDrugHistory(userId)
      setDrugHistory(drug)
      setTherapistId(currentTherapistId)
    } catch (error) {
      console.error('Error loading drug history:', error)
      toast.error('Failed to load drug history')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDrugHistory = async () => {
    if (!therapistId || !drugForm.medication_name || !drugForm.dosage || !drugForm.start_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const newDrug = await addPatientDrugHistory(userId, therapistId, {
        medication_name: drugForm.medication_name,
        dosage: drugForm.dosage,
        start_date: drugForm.start_date,
        prescribing_doctor: drugForm.prescribing_doctor,
        notes: drugForm.notes,
        duration_of_usage: drugForm.duration_of_usage
      })
      
      if (newDrug) {
        setDrugHistory(prev => [newDrug, ...prev])
        setDrugForm({
          medication_name: '',
          dosage: '',
          start_date: '',
          prescribing_doctor: '',
          notes: '',
          duration_of_usage: ''
        })
        setIsAddingDrug(false)
        toast.success('Drug history added successfully')
      }
    } catch (error) {
      console.error('Error adding drug history:', error)
      toast.error('Failed to add drug history')
    }
  }

  const handleEditDrugHistory = (item: PatientDrugHistory) => {
    setEditingDrugId(item.id!)
    setDrugForm({
      medication_name: item.medication_name,
      dosage: item.dosage,
      start_date: item.start_date,
      prescribing_doctor: item.prescribing_doctor || '',
      notes: item.notes || '',
      duration_of_usage: item.duration_of_usage || ''
    })
  }

  const handleUpdateDrugHistory = async () => {
    if (!editingDrugId || !drugForm.medication_name || !drugForm.dosage || !drugForm.start_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const updated = await updatePatientDrugHistory(editingDrugId, {
        medication_name: drugForm.medication_name,
        dosage: drugForm.dosage,
        start_date: drugForm.start_date,
        prescribing_doctor: drugForm.prescribing_doctor,
        notes: drugForm.notes,
        duration_of_usage: drugForm.duration_of_usage
      })

      if (updated) {
        setDrugHistory(prev => prev.map(item => 
          item.id === editingDrugId ? updated : item
        ))
        setEditingDrugId(null)
        setDrugForm({
          medication_name: '',
          dosage: '',
          start_date: '',
          prescribing_doctor: '',
          notes: '',
          duration_of_usage: ''
        })
        toast.success('Drug history updated successfully')
      }
    } catch (error) {
      console.error('Error updating drug history:', error)
      toast.error('Failed to update drug history')
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
        <span>Loading drug history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!readOnly && therapistId && (
        <div className="flex justify-end">
          <Dialog open={isAddingDrug} onOpenChange={setIsAddingDrug}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medication_name">Medication Name *</Label>
                  <Input
                    id="medication_name"
                    value={drugForm.medication_name}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, medication_name: e.target.value }))}
                    placeholder="e.g., Sertraline"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    value={drugForm.dosage}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 50mg daily"
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={drugForm.start_date}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_of_usage">Duration of Usage</Label>
                  <Input
                    id="duration_of_usage"
                    value={drugForm.duration_of_usage}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, duration_of_usage: e.target.value }))}
                    placeholder="e.g., 6 months"
                  />
                </div>
                <div>
                  <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                  <Input
                    id="prescribing_doctor"
                    value={drugForm.prescribing_doctor}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, prescribing_doctor: e.target.value }))}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="drug_notes">Notes</Label>
                  <Textarea
                    id="drug_notes"
                    value={drugForm.notes}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the medication..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddDrugHistory} className="flex-1">
                    Add Medication
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingDrug(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {drugHistory.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Duration</TableHead>
                {!readOnly && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drugHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.medication_name}</TableCell>
                  <TableCell>{item.dosage}</TableCell>
                  <TableCell>{formatDate(item.start_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.duration_of_usage || "N/A"}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditDrugHistory(item)}
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
          <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No medications recorded yet.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingDrugId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingDrugId(null)
          setDrugForm({
            medication_name: '',
            dosage: '',
            start_date: '',
            prescribing_doctor: '',
            notes: '',
            duration_of_usage: ''
          })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_medication_name">Medication Name *</Label>
              <Input
                id="edit_medication_name"
                value={drugForm.medication_name}
                onChange={(e) => setDrugForm(prev => ({ ...prev, medication_name: e.target.value }))}
                placeholder="e.g., Sertraline"
              />
            </div>
            <div>
              <Label htmlFor="edit_dosage">Dosage *</Label>
              <Input
                id="edit_dosage"
                value={drugForm.dosage}
                onChange={(e) => setDrugForm(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 50mg daily"
              />
            </div>
            <div>
              <Label htmlFor="edit_start_date">Start Date *</Label>
              <Input
                id="edit_start_date"
                type="date"
                value={drugForm.start_date}
                onChange={(e) => setDrugForm(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_duration_of_usage">Duration of Usage</Label>
              <Input
                id="edit_duration_of_usage"
                value={drugForm.duration_of_usage}
                onChange={(e) => setDrugForm(prev => ({ ...prev, duration_of_usage: e.target.value }))}
                placeholder="e.g., 6 months"
              />
            </div>
            <div>
              <Label htmlFor="edit_prescribing_doctor">Prescribing Doctor</Label>
              <Input
                id="edit_prescribing_doctor"
                value={drugForm.prescribing_doctor}
                onChange={(e) => setDrugForm(prev => ({ ...prev, prescribing_doctor: e.target.value }))}
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <Label htmlFor="edit_drug_notes">Notes</Label>
              <Textarea
                id="edit_drug_notes"
                value={drugForm.notes}
                onChange={(e) => setDrugForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the medication..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateDrugHistory} className="flex-1">
                Update Medication
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingDrugId(null)
                setDrugForm({
                  medication_name: '',
                  dosage: '',
                  start_date: '',
                  prescribing_doctor: '',
                  notes: '',
                  duration_of_usage: ''
                })
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

