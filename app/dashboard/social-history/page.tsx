"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { patientProfileData } from "@/lib/data" // Import centralized data

export default function SocialHistoryPage() {
  const { socialHistory } = patientProfileData

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Social History</h2>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Lifestyle & Relationships</CardTitle>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Social History</span>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Living Situation</p>
            <p className="text-base font-semibold">{socialHistory.livingSituation}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Employment</p>
            <p className="text-base font-semibold">{socialHistory.employment}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Relationships</p>
            <p className="text-base font-semibold">{socialHistory.relationships}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Hobbies & Interests</p>
            <p className="text-base font-semibold">{socialHistory.hobbiesInterests}</p>
          </div>
          <div className="flex flex-col sm:col-span-2">
            <p className="font-medium text-sm text-muted-foreground">Stressors</p>
            <p className="text-base font-semibold">{socialHistory.stressors}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Substance Use History</CardTitle>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Substance Use History</span>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Smoking</p>
            <p className="text-base font-semibold">{socialHistory.substanceUse.smoking}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-muted-foreground">Alcohol</p>
            <p className="text-base font-semibold">{socialHistory.substanceUse.alcohol}</p>
          </div>
          <div className="flex flex-col sm:col-span-2">
            <p className="font-medium text-sm text-muted-foreground">Other Drug Use</p>
            <p className="text-base font-semibold">{socialHistory.substanceUse.otherDrugs}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
