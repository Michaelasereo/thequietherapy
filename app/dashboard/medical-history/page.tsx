import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function MedicalHistoryPage() {
  // Default data in case imports are not available during build
  const patientProfileData = {
    name: "John Doe",
    age: "32",
    sex: "Male",
    maritalStatus: "Single",
    occupation: "Software Engineer",
    levelOfEducation: "Master's Degree",
    familyHistory: {
      mentalHealth: "Mother had depression, paternal uncle with anxiety.",
      substanceAbuse: "No known family history of substance abuse.",
      otherMedical: "Family history of hypertension on maternal side.",
    },
    socialHistory: {
      livingSituation: "Lives alone in an apartment.",
      employment: "Full-time software engineer, works remotely.",
      relationships: "Close relationship with sister, few close friends.",
      hobbiesInterests: "Enjoys reading, hiking, and playing video games.",
      substanceUse: {
        smoking: "No history of smoking.",
        alcohol: "Occasional social drinking (1-2 drinks per week).",
        otherDrugs: "No illicit drug use.",
      },
      stressors: "Work-related stress, recent breakup.",
    },
  }

  const medicalHistory = [
    {
      id: "mh1",
      condition: "Generalized Anxiety Disorder (GAD)",
      diagnosisDate: "2023-01-10",
      notes: "Diagnosed by primary care physician. Managed with therapy and lifestyle changes.",
    },
    {
      id: "mh2",
      condition: "Seasonal Allergies",
      diagnosisDate: "2010-03-01",
      notes: "Seasonal allergies to pollen. Managed with over-the-counter antihistamines.",
    },
  ]

  const medications = [
    {
      id: "med1",
      name: "Sertraline (Zoloft)",
      dosage: "50mg daily",
      startDate: "2023-02-15",
      prescribingDoctor: "Dr. Smith (PCP)",
      notes: "Prescribed for GAD. No significant side effects reported.",
      durationOfUsage: "2 years",
    },
    {
      id: "med2",
      name: "Ibuprofen",
      dosage: "200mg as needed",
      startDate: "2024-01-01",
      prescribingDoctor: "Self-prescribed",
      notes: "For occasional headaches.",
      durationOfUsage: "Ongoing (1 year)",
    },
  ]

  const format = (date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Medical History</h2>

      {/* Patient Basic Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="font-medium">{patientProfileData.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <p className="font-medium">{patientProfileData.age} years</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gender</label>
              <p className="font-medium">{patientProfileData.sex}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
              <p className="font-medium">{patientProfileData.maritalStatus}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Occupation</label>
              <p className="font-medium">{patientProfileData.occupation}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Education</label>
              <p className="font-medium">{patientProfileData.levelOfEducation}</p>
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
            <p className="text-sm text-muted-foreground">{patientProfileData.familyHistory.mentalHealth}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Substance Abuse History</h4>
            <p className="text-sm text-muted-foreground">{patientProfileData.familyHistory.substanceAbuse}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Other Medical Conditions</h4>
            <p className="text-sm text-muted-foreground">{patientProfileData.familyHistory.otherMedical}</p>
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
              <p className="text-sm text-muted-foreground">{patientProfileData.socialHistory.livingSituation}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Employment</h4>
              <p className="text-sm text-muted-foreground">{patientProfileData.socialHistory.employment}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Relationships</h4>
              <p className="text-sm text-muted-foreground">{patientProfileData.socialHistory.relationships}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Hobbies & Interests</h4>
              <p className="text-sm text-muted-foreground">{patientProfileData.socialHistory.hobbiesInterests}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Substance Use</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Smoking</label>
                <p className="text-sm">{patientProfileData.socialHistory.substanceUse.smoking}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Alcohol</label>
                <p className="text-sm">{patientProfileData.socialHistory.substanceUse.alcohol}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Other Drugs</label>
                <p className="text-sm">{patientProfileData.socialHistory.substanceUse.otherDrugs}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Stressors</h4>
            <p className="text-sm text-muted-foreground">{patientProfileData.socialHistory.stressors}</p>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Previous Diagnosis</CardTitle>
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
                    <TableCell>{format(new Date(item.diagnosisDate), "PPP")}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No previous diagnoses recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Drug History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Drug History</CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length > 0 ? (
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
                {medications.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{format(new Date(item.startDate), "PPP")}</TableCell>
                    <TableCell>{item.durationOfUsage}</TableCell>
                    <TableCell>{item.prescribingDoctor}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No medication history recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
