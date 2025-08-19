"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"

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

interface TherapistCardProps {
  therapist: {
    id: string
    name: string
    picture: string
    specialization: string
    gender: string
    age: string
    maritalStatus: string
    isVerified?: boolean
    is_active?: boolean
    hourly_rate?: number
  }
  onSelect: (therapistId: string) => void
  onViewProfile: (therapistId: string) => void
  isSelected: boolean
}

export default function TherapistCard({ therapist, onSelect, onViewProfile, isSelected }: TherapistCardProps) {
  const isAvailable = therapist.is_active !== false

  return (
    <Card
      className={`flex flex-col items-center text-center p-4 shadow-sm transition-all ${isSelected ? "border-2 border-primary ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <div className="relative">
        <Image
          src={therapist.picture || "/placeholder.svg"}
          alt={therapist.name}
          width={100}
          height={100}
          className="rounded-full object-cover mb-4"
        />
        {/* Availability Badge */}
        <div className="absolute -top-2 -right-2">
          <Badge 
            variant={isAvailable ? "default" : "secondary"}
            className={`flex items-center gap-1 text-xs ${
              isAvailable 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Available
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Unavailable
              </>
            )}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-0 mb-2">
        <div className="flex items-center justify-center gap-1">
          <CardTitle className="text-lg font-semibold">{therapist.name}</CardTitle>
          {therapist.isVerified && (
            <TwitterVerifiedBadge className="h-4 w-4" />
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">{therapist.specialization}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-2 p-0 w-full">
        <div className="text-xs text-muted-foreground">
          {therapist.gender}, {therapist.age}, {therapist.maritalStatus}
        </div>
        
        {/* Hourly Rate */}
        {therapist.hourly_rate && (
          <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
            <Clock className="h-3 w-3" />
            ₦{therapist.hourly_rate.toLocaleString()}/hr
          </div>
        )}
        
        <div className="flex gap-2 mt-2 w-full">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onViewProfile(therapist.id)}>
            View Profile
          </Button>
          <Button 
            className="flex-1" 
            onClick={() => onSelect(therapist.id)} 
            disabled={isSelected || !isAvailable}
          >
            {isSelected ? "Selected" : isAvailable ? "Select" : "Unavailable"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
