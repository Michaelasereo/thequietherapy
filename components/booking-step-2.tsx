"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import TherapistCard from "@/components/therapist-card"
import TherapistProfileModal from "@/components/therapist-profile-modal"

interface BookingStep2Props {
  onNext: (therapistId: string) => void
  onBack: () => void
  initialSelectedTherapistId?: string
}

export default function BookingStep2({ onNext, onBack, initialSelectedTherapistId }: BookingStep2Props) {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>(initialSelectedTherapistId)
  const [filterGender, setFilterGender] = useState<string>("All")
  const [filterAge, setFilterAge] = useState<string>("All")
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string>("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTherapist, setModalTherapist] = useState<any>(null)
  const [therapists, setTherapists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real therapist data
  useEffect(() => {
    fetch('/api/therapists')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setTherapists(data.therapists)
        }
      })
      .catch(error => {
        console.error('Error fetching therapists:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredTherapists = therapists.filter((therapist) => {
    const genderMatch = filterGender === "All" || therapist.gender === filterGender
    const ageMatch = filterAge === "All" || therapist.age === filterAge
    const maritalStatusMatch = filterMaritalStatus === "All" || therapist.maritalStatus === filterMaritalStatus
    return genderMatch && ageMatch && maritalStatusMatch
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Age Groups</SelectItem>
            <SelectItem value="20s">20s</SelectItem>
            <SelectItem value="30s">30s</SelectItem>
            <SelectItem value="40s">40s</SelectItem>
            <SelectItem value="50s">50s</SelectItem>
            <SelectItem value="60s">60s+</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMaritalStatus} onValueChange={setFilterMaritalStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Marital Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Marital Statuses</SelectItem>
            <SelectItem value="Single">Single</SelectItem>
            <SelectItem value="Married">Married</SelectItem>
            <SelectItem value="Divorced">Divorced</SelectItem>
            <SelectItem value="Widowed">Widowed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
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
        <Button onClick={() => selectedTherapistId && onNext(selectedTherapistId)} disabled={!selectedTherapistId}>
          Next: Checkout
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
