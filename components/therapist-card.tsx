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
      className={`relative overflow-hidden transition-all duration-300 ${
        isSelected 
          ? "border-2 border-primary ring-2 ring-primary shadow-lg" 
          : "hover:shadow-lg hover:scale-[1.02] border-gray-200"
      }`}
    >
      {/* Image Section with Overlay Button */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        <Image
          src={therapist.picture || "/placeholder.svg"}
          alt={therapist.name}
          fill
          className="object-cover"
        />
        
        {/* View Profile Button - Overlaid on image */}
        <div className="absolute bottom-3 right-3">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white text-gray-700 font-medium"
            onClick={() => onViewProfile(therapist.id)}
          >
            View Profile
          </Button>
        </div>
        
        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={isAvailable ? "default" : "secondary"}
            className={`flex items-center gap-1 text-xs font-medium ${
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
      
      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Name and Specialization */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-gray-900">{therapist.name}</CardTitle>
            {therapist.isVerified && (
              <TwitterVerifiedBadge className="h-4 w-4 flex-shrink-0" />
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            {therapist.specialization}
          </Badge>
        </div>
        
        {/* Service Description */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Callout:</p>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            Professional therapy services delivered through individual sessions and teletherapy, 
            tailored to your specific needs and preferences. Evidence-based interventions for 
            comprehensive mental health support.
          </p>
        </div>
        
        {/* Hourly Rate */}
        {therapist.hourly_rate && (
          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
            <Clock className="h-3 w-3" />
            ₦{therapist.hourly_rate.toLocaleString()}/hr
          </div>
        )}
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            {therapist.gender}
          </Badge>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            {therapist.maritalStatus}
          </Badge>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            {therapist.age}
          </Badge>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            Virtual
          </Badge>
        </div>
        
        {/* Select Button */}
        <Button 
          className={`w-full mt-3 ${
            isSelected 
              ? "bg-primary text-white" 
              : isAvailable 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={() => onSelect(therapist.id)} 
          disabled={isSelected || !isAvailable}
        >
          {isSelected ? "Selected" : isAvailable ? "Select Therapist" : "Unavailable"}
        </Button>
      </CardContent>
    </Card>
  )
}
