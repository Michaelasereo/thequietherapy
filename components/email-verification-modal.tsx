"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, ArrowRight } from "lucide-react"

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onGoToDashboard?: () => void
}

export default function EmailVerificationModal({ 
  isOpen, 
  onClose, 
  email,
  onGoToDashboard 
}: EmailVerificationModalProps) {
  
  const handleGoToDashboard = () => {
    // Redirect to login page which will handle verification
    window.location.href = "/login?user_type=individual"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">Payment Successful!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your session has been booked successfully.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Email Verification Section */}
          <div className="bg-brand-gold/10 p-4 rounded-lg border border-brand-gold">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-brand-gold" />
              <div>
                <h4 className="font-semibold text-gray-900">Verify Your Email</h4>
                <p className="text-sm text-gray-700">{email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-900">
              We've sent a verification link to your email. Click the link to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-900">
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">•</span>
                <span>Log in to an existing account</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">•</span>
                <span>Or create a new account</span>
              </li>
            </ul>
          </div>

          {/* Dashboard Access Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Access Your Dashboard</h4>
            <p className="text-sm text-gray-700">
              Once verified, enter your dashboard to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>View session details and schedule</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Join your therapy session at the scheduled time</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Manage your appointments</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> Check your spam folder if you don't see the email within a few minutes.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleGoToDashboard}
            className="w-full bg-black hover:bg-gray-800"
          >
            Go to Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

