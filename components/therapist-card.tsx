"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TherapistCardProps {
  therapist: {
    id: string
    name: string
    picture: string
    specialization: string
    gender: string
    age: string
    maritalStatus: string
  }
  onSelect: (therapistId: string) => void
  onViewProfile: (therapistId: string) => void
  isSelected: boolean
}

export default function TherapistCard({ therapist, onSelect, onViewProfile, isSelected }: TherapistCardProps) {
  return (
    <Card
      className={`flex flex-col items-center text-center p-4 shadow-sm transition-all ${isSelected ? "border-2 border-primary ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <Image
        src={therapist.picture || "/placeholder.svg"}
        alt={therapist.name}
        width={100}
        height={100}
        className="rounded-full object-cover mb-4"
      />
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-lg font-semibold">{therapist.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{therapist.specialization}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 w-full">
        <div className="text-xs text-muted-foreground">
          {therapist.gender}, {therapist.age}, {therapist.maritalStatus}
        </div>
        <div className="flex gap-2 mt-2 w-full">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onViewProfile(therapist.id)}>
            View Profile
          </Button>
          <Button className="flex-1" onClick={() => onSelect(therapist.id)} disabled={isSelected}>
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
