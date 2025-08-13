"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { Button } from "@/components/ui/button"

// Twitter-style verification badge component
function TwitterVerifiedBadge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main circle with zigzag edge effect */}
      <path
        d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"
        fill="#1DA1F2"
      />
      {/* Zigzag pattern overlay */}
      <path
        d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20C6.486 21 2 16.514 2 11S6.486 1 12 1s10 4.486 10 10-4.486 10-10 10z"
        fill="none"
        stroke="#000000"
        strokeWidth="0.5"
        strokeDasharray="1,1"
      />
      {/* Inner zigzag pattern */}
      <path
        d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18C7.589 20 4 16.411 4 12s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
        fill="none"
        stroke="#000000"
        strokeWidth="0.3"
        strokeDasharray="0.5,0.5"
      />
      {/* Checkmark */}
      <path
        d="M9.5 12.5L11 14L14.5 10.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
    isVerified?: boolean
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
          <div className="flex items-center justify-center gap-2">
            <DialogTitle className="text-2xl font-bold">{therapist.name}</DialogTitle>
            {therapist.isVerified && (
              <TwitterVerifiedBadge className="h-5 w-5" />
            )}
          </div>
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
