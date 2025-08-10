"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { patientProfileData } from "@/lib/data" // Import centralized data

export default function FamilyHistoryPage() {
  const { familyHistory } = patientProfileData

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Family History</h2>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Family Medical & Mental Health History</CardTitle>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Family History</span>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-4">
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Mental Health History</p>
            <p className="text-base font-semibold">{familyHistory.mentalHealth}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Substance Abuse History</p>
            <p className="text-base font-semibold">{familyHistory.substanceAbuse}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Other Medical History</p>
            <p className="text-base font-semibold">{familyHistory.otherMedical}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
