import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export default function PatientBiodataPage() {
  // Default data in case patientProfileData is not available during build
  const currentPatientData = {
    name: "John Doe",
    age: "32",
    sex: "Male",
    religion: "Christianity",
    occupation: "Software Engineer",
    maritalStatus: "Single",
    tribe: "Yoruba",
    levelOfEducation: "Master's Degree",
    complaints: "Anxiety, stress, difficulty sleeping.",
    therapistPreference: "CBT specialist, female therapist.",
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Patient Biodata</h2>

      {/* Personal Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Personal Information</span>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Name</p>
            <p className="text-base font-semibold">{currentPatientData.name}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Age</p>
            <p className="text-base font-semibold">{currentPatientData.age}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Sex</p>
            <p className="text-base font-semibold">{currentPatientData.sex}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Religion</p>
            <p className="text-base font-semibold">{currentPatientData.religion}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Occupation</p>
            <p className="text-base font-semibold">{currentPatientData.occupation}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Marital Status</p>
            <p className="text-base font-semibold">{currentPatientData.maritalStatus}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Tribe</p>
            <p className="text-base font-semibold">{currentPatientData.tribe}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Level of Education</p>
            <p className="text-base font-semibold">{currentPatientData.levelOfEducation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Therapy Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Therapy Information</CardTitle>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Therapy Information</span>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-4">
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Complaints/Enquiry</p>
            <p className="text-base font-semibold">{currentPatientData.complaints}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Therapist Preference</p>
            <p className="text-base font-semibold">{currentPatientData.therapistPreference}</p>
          </div>
        </CardContent>
      </Card>

      {/* Social History Card (Moved from here to its own page) */}
      {/* Family History Card (Moved from here to its own page) */}
    </div>
  )
}
