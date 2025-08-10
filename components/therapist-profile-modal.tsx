"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface TherapistProfileModalProps {
  isOpen: boolean
  onClose: () => void
  therapist: {
    id: string
    name: string
    picture: string
    specialization: string
    gender: string
    age: string
    maritalStatus: string
    bio: string
    availability: string[]
  } | null
  onSelectTherapist: (therapistId: string) => void
  isSelected: boolean
}

export default function TherapistProfileModal({
  isOpen,
  onClose,
  therapist,
  onSelectTherapist,
  isSelected,
}: TherapistProfileModalProps) {
  if (!therapist) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] p-6">
        <DialogHeader className="text-center">
          <Image
            src={therapist.picture || "/placeholder.svg"}
            alt={therapist.name}
            width={120}
            height={120}
            className="rounded-full object-cover mx-auto mb-4"
          />
          <DialogTitle className="text-2xl font-bold">{therapist.name}</DialogTitle>
          <DialogDescription className="text-md text-muted-foreground">{therapist.specialization}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-muted-foreground text-center">
            {therapist.gender}, {therapist.age}, {therapist.maritalStatus}
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">About Me</h4>
            <p className="text-sm text-muted-foreground">{therapist.bio}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">Availability</h4>
            <p className="text-sm text-muted-foreground">{therapist.availability.join(", ")}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            onSelectTherapist(therapist.id)
            onClose()
          }}
          disabled={isSelected}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select This Therapist"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
