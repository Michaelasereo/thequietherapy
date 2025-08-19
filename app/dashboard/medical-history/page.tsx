'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Stethoscope, Pill } from "lucide-react"
import { usePatientData } from "@/hooks/usePatientData"
import { useEffect } from "react"

export default function MedicalHistoryPage() {
  const { 
    biodata,
    familyHistory,
    socialHistory,
    medicalHistory,
    drugHistory,
    loading,
    errors,
    refreshBiodata,
    refreshFamilyHistory,
    refreshSocialHistory,
    refreshMedicalHistory,
    refreshDrugHistory
  } = usePatientData()

  // Load all data on mount
  useEffect(() => {
    refreshBiodata()
    refreshFamilyHistory()
    refreshSocialHistory()
    refreshMedicalHistory()
    refreshDrugHistory()
  }, [refreshBiodata, refreshFamilyHistory, refreshSocialHistory, refreshMedicalHistory, refreshDrugHistory])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading.medicalHistory || loading.drugHistory) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Medical History</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading medical information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Medical History</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="h-4 w-4" />
          <span>Therapist-managed information</span>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Medical history and drug information are managed by your therapist. This information is displayed here for your reference only.
        </AlertDescription>
      </Alert>

      {/* Patient Basic Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="font-medium">{biodata?.firstName || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <p className="font-medium">{biodata?.age ? `${biodata.age} years` : "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gender</label>
              <p className="font-medium">{biodata?.sex || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
              <p className="font-medium">{biodata?.marital_status || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Occupation</label>
              <p className="font-medium">{biodata?.occupation || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Education</label>
              <p className="font-medium">{biodata?.level_of_education || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Family History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Mental Health History</h4>
            <p className="text-sm text-muted-foreground">{familyHistory?.mental_health_history || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Substance Abuse History</h4>
            <p className="text-sm text-muted-foreground">{familyHistory?.substance_abuse_history || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Other Medical Conditions</h4>
            <p className="text-sm text-muted-foreground">{familyHistory?.other_medical_history || "Not provided"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Social History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Social History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Living Situation</h4>
              <p className="text-sm text-muted-foreground">{socialHistory?.living_situation || "Not provided"}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Employment</h4>
              <p className="text-sm text-muted-foreground">{socialHistory?.employment || "Not provided"}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Relationships</h4>
              <p className="text-sm text-muted-foreground">{socialHistory?.relationships || "Not provided"}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Hobbies & Interests</h4>
              <p className="text-sm text-muted-foreground">{socialHistory?.hobbies_interests || "Not provided"}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Substance Use</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Smoking</label>
                <p className="text-sm">{socialHistory?.smoking_history || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Alcohol</label>
                <p className="text-sm">{socialHistory?.alcohol_history || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Other Drugs</label>
                <p className="text-sm">{socialHistory?.other_drugs_history || "Not provided"}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Stressors</h4>
            <p className="text-sm text-muted-foreground">{socialHistory?.stressors || "Not provided"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Medical History - Read Only */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Previous Diagnosis
            <Badge variant="secondary" className="ml-auto">Therapist Managed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicalHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Diagnosis Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicalHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.condition}</TableCell>
                    <TableCell>{formatDate(item.diagnosis_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes || "No notes"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical diagnoses recorded yet.</p>
              <p className="text-sm">Your therapist will add this information during your sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drug History - Read Only */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Drug History
            <Badge variant="secondary" className="ml-auto">Therapist Managed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drugHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Duration of Usage</TableHead>
                  <TableHead>Prescribing Doctor</TableHead>
                  <TableHead>Notes</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medication history recorded yet.</p>
              <p className="text-sm">Your therapist will add this information during your sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
