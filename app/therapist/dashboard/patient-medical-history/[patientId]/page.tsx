'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Stethoscope, Pill, Loader2, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  PatientMedicalHistory, 
  PatientDrugHistory,
  getPatientMedicalHistory,
  getPatientDrugHistory,
  addPatientMedicalHistory,
  addPatientDrugHistory,
  getCurrentUserId,
  getPatientBiodataById
} from "@/lib/patient-data"
import { checkTherapistClientAccess } from "@/lib/therapist-data"
import { toast } from "@/components/ui/use-toast"

export default function PatientMedicalHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string
  
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory[]>([])
  const [drugHistory, setDrugHistory] = useState<PatientDrugHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [therapistId, setTherapistId] = useState<string | null>(null)
  const [patientName, setPatientName] = useState<string>("Client")
  
  // Form states
  const [isAddingMedical, setIsAddingMedical] = useState(false)
  const [isAddingDrug, setIsAddingDrug] = useState(false)
  const [medicalForm, setMedicalForm] = useState({
    condition: '',
    diagnosis_date: '',
    notes: ''
  })
  const [drugForm, setDrugForm] = useState({
    medication_name: '',
    dosage: '',
    start_date: '',
    prescribing_doctor: '',
    notes: '',
    duration_of_usage: ''
  })

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const currentTherapistId = await getCurrentUserId()
        if (!currentTherapistId) {
          throw new Error('Therapist not authenticated')
        }

        // Check if therapist has access to this client
        const hasAccess = await checkTherapistClientAccess(currentTherapistId, patientId)
        if (!hasAccess) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this client's medical history.",
            variant: "destructive",
          })
          router.push('/therapist/dashboard/clients')
          return
        }

        const [medical, drug, patientBiodata] = await Promise.all([
          getPatientMedicalHistory(patientId),
          getPatientDrugHistory(patientId),
          getPatientBiodataById(patientId)
        ])
        
        setMedicalHistory(medical)
        setDrugHistory(drug)
        setTherapistId(currentTherapistId)
        
        // Set patient name from biodata
        if (patientBiodata?.firstName) {
          setPatientName(patientBiodata.firstName)
        } else {
          setPatientName("Client")
        }
      } catch (error) {
        console.error('Error loading patient data:', error)
        toast({
          title: "Error",
          description: "Failed to load patient data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (patientId) {
      loadData()
    }
  }, [patientId, router])

  const handleAddMedicalHistory = async () => {
    if (!therapistId || !medicalForm.condition || !medicalForm.diagnosis_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const newMedical = await addPatientMedicalHistory(
        patientId,
        therapistId,
        {
          condition: medicalForm.condition,
          diagnosis_date: medicalForm.diagnosis_date,
          notes: medicalForm.notes
        }
      )
      
      if (newMedical) {
        setMedicalHistory(prev => [newMedical, ...prev])
        setMedicalForm({ condition: '', diagnosis_date: '', notes: '' })
        setIsAddingMedical(false)
        toast({
          title: "Success",
          description: "Medical history added successfully.",
        })
      }
    } catch (error) {
      console.error('Error adding medical history:', error)
      toast({
        title: "Error",
        description: "Failed to add medical history.",
        variant: "destructive",
      })
    }
  }

  const handleAddDrugHistory = async () => {
    if (!therapistId || !drugForm.medication_name || !drugForm.dosage || !drugForm.start_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const newDrug = await addPatientDrugHistory(
        patientId,
        therapistId,
        {
          medication_name: drugForm.medication_name,
          dosage: drugForm.dosage,
          start_date: drugForm.start_date,
          prescribing_doctor: drugForm.prescribing_doctor,
          notes: drugForm.notes,
          duration_of_usage: drugForm.duration_of_usage
        }
      )
      
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
        toast({
          title: "Success",
          description: "Drug history added successfully.",
        })
      }
    } catch (error) {
      console.error('Error adding drug history:', error)
      toast({
        title: "Error",
        description: "Failed to add drug history.",
        variant: "destructive",
      })
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href={`/therapist/dashboard/clients/${patientId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client
            </Link>
          </Button>
        </div>
        <h2 className="text-2xl font-bold">Medical History - {patientName}</h2>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading patient data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost">
          <Link href={`/therapist/dashboard/clients/${patientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical History</h2>
          <p className="text-sm text-muted-foreground">Managing medical and drug history for {patientName}</p>
        </div>
      </div>

      {/* Medical History Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Medical History
          </CardTitle>
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
        </CardHeader>
        <CardContent>
          {medicalHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Diagnosis Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicalHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.condition}</TableCell>
                    <TableCell>{formatDate(item.diagnosis_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes || "No notes"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical diagnoses recorded yet.</p>
              <p className="text-sm">Add the first diagnosis using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drug History Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Drug History
          </CardTitle>
          <Dialog open={isAddingDrug} onOpenChange={setIsAddingDrug}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medication_name">Medication Name *</Label>
                    <Input
                      id="medication_name"
                      value={drugForm.medication_name}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, medication_name: e.target.value }))}
                      placeholder="e.g., Sertraline (Zoloft)"
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
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                    <Input
                      id="prescribing_doctor"
                      value={drugForm.prescribing_doctor}
                      onChange={(e) => setDrugForm(prev => ({ ...prev, prescribing_doctor: e.target.value }))}
                      placeholder="e.g., Dr. Smith (PCP)"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration_of_usage">Duration of Usage</Label>
                  <Input
                    id="duration_of_usage"
                    value={drugForm.duration_of_usage}
                    onChange={(e) => setDrugForm(prev => ({ ...prev, duration_of_usage: e.target.value }))}
                    placeholder="e.g., 2 years, Ongoing"
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
        </CardHeader>
        <CardContent>
          {drugHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Prescribing Doctor</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.medication_name}</TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{formatDate(item.start_date)}</TableCell>
                    <TableCell>{item.duration_of_usage || "Ongoing"}</TableCell>
                    <TableCell>{item.prescribing_doctor || "Not specified"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes || "No notes"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medication history recorded yet.</p>
              <p className="text-sm">Add the first medication using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
