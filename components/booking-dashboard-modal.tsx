"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BookingProgress from "@/components/booking-progress"
import BookingStep1 from "@/components/booking-step-1"
import BookingStep2 from "@/components/booking-step-2"
import BookingStep3 from "@/components/booking-step-3"
import { useRouter } from "next/navigation" // Import useRouter for redirection

interface BookingDashboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BookingDashboardModal({ isOpen, onClose }: BookingDashboardModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [patientBiodata, setPatientBiodata] = useState<any>(null)
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>(undefined)
  const router = useRouter()

  const handleStep1Next = (data: any) => {
    setPatientBiodata(data)
    setCurrentStep(2)
  }

  const handleStep2Next = (therapistId: string) => {
    setSelectedTherapistId(therapistId)
    setCurrentStep(3)
  }

  const handleStep3Checkout = () => {
    // Simulate final booking success
    // In a real app, this would involve API calls to confirm the booking
    onClose() // Close the modal
    setCurrentStep(1) // Reset steps for next booking
    setPatientBiodata(null) // Clear data
    setSelectedTherapistId(undefined) // Clear data
    router.push("/dashboard/sessions") // Redirect to sessions page after successful booking
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BookingStep1 onNext={handleStep1Next} initialData={patientBiodata} />
      case 2:
        return (
          <BookingStep2
            onNext={handleStep2Next}
            onBack={() => setCurrentStep(1)}
            initialSelectedTherapistId={selectedTherapistId}
          />
        )
      case 3:
        return (
          <BookingStep3
            onBack={() => setCurrentStep(2)}
            onCheckout={handleStep3Checkout}
            selectedTherapistId={selectedTherapistId!}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-2xl font-bold">Book a New Session</DialogTitle>
        </DialogHeader>
        <BookingProgress
          currentStep={currentStep}
          totalSteps={3}
          labels={["Patient Biodata", "Select Therapist", "Checkout"]}
        />
        <div className="flex-1 overflow-y-auto">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  )
}
