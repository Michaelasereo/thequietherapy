"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import TherapistCard from "@/components/therapist-card"
import TherapistProfileModal from "@/components/therapist-profile-modal"

interface BookingStep2Props {
  onNext: (therapistId: string, therapistData?: any) => void
  onBack: () => void
  initialSelectedTherapistId?: string
}

export default function BookingStep2({ onNext, onBack, initialSelectedTherapistId }: BookingStep2Props) {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>(initialSelectedTherapistId)
  const [filterGender, setFilterGender] = useState<string>("All")
  const [filterSpecialization, setFilterSpecialization] = useState<string>("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTherapist, setModalTherapist] = useState<any>(null)
  const [therapists, setTherapists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Predefined list of therapy specializations
  const specializations = [
    "Anxiety & Stress Management",
    "Depression & Mood Disorders", 
    "Relationship & Family Therapy",
    "Trauma & PTSD",
    "Addiction & Recovery"
  ]

  // Fetch real therapist data
  useEffect(() => {
    setLoading(true)
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setTherapists([])
    }, 10000)
    
    fetch('/api/therapists')
      .then(response => {
        clearTimeout(timeoutId)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        if (data.success && Array.isArray(data.therapists)) {
          // Transform API data to match TherapistCard expected format
          const transformedTherapists = data.therapists.map((therapist: any) => ({
            id: therapist.id,
            name: therapist.full_name || 'Unknown Therapist',
            email: therapist.email,
            profile_image_url: therapist.profile_image_url || '/placeholder.svg', // ✅ STANDARDIZED
            specialization: Array.isArray(therapist.specializations) 
              ? therapist.specializations.join(', ') || 'General Therapy'
              : therapist.specializations || 'General Therapy',
            gender: therapist.gender || '',
            age: therapist.age || '',
            maritalStatus: therapist.maritalStatus || '',
            isVerified: therapist.verification_status === 'verified',
            is_active: therapist.availability_status === 'available',
            hourly_rate: therapist.session_rate || 5000,
            bio: therapist.bio || 'Professional therapist ready to help you.',
            languages: therapist.languages || ['English']
          }))
          
          setTherapists(transformedTherapists)
        } else {
          setTherapists([])
        }
      })
      .catch(error => {
        clearTimeout(timeoutId)
        console.error('Error fetching therapists:', error)
        setTherapists([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredTherapists = therapists.filter((therapist) => {
    const genderMatch = filterGender === "All" || therapist.gender === filterGender
    const specializationMatch = filterSpecialization === "All" || therapist.specialization === filterSpecialization
    return genderMatch && specializationMatch
  })

  const handleViewProfile = (id: string) => {
    const therapist = therapists.find((t) => t.id === id)
    if (therapist) {
      setModalTherapist(therapist)
      setIsModalOpen(true)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">Select Your Therapist</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select value={filterGender} onValueChange={setFilterGender}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Non-binary">Non-binary</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Specialization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Specializations</SelectItem>
            {specializations.map((specialization) => (
              <SelectItem key={specialization} value={specialization}>
                {specialization}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-4">Loading therapists...</p>
          </div>
        ) : filteredTherapists.length > 0 ? (
          filteredTherapists.map((therapist) => (
            <TherapistCard
              key={therapist.id}
              therapist={therapist}
              onSelect={setSelectedTherapistId}
              onViewProfile={handleViewProfile}
              isSelected={selectedTherapistId === therapist.id}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No therapists available at the moment.</p>
            <p className="text-sm text-muted-foreground">Please check back later or contact support for assistance.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={() => {
            if (selectedTherapistId) {
              const selectedTherapist = therapists.find(t => t.id === selectedTherapistId)
              onNext(selectedTherapistId, selectedTherapist)
            }
          }} 
          disabled={!selectedTherapistId}
        >
          Next: Choose Availability
        </Button>
      </div>

      <TherapistProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        therapist={modalTherapist}
        onSelectTherapist={(id) => {
          setSelectedTherapistId(id)
          setIsModalOpen(false)
        }}
        isSelected={selectedTherapistId === modalTherapist?.id}
      />
    </div>
  )
}
