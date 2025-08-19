"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Clock, CheckCircle, AlertCircle, Upload, FileText } from "lucide-react"
import { useTherapistUser } from "@/context/therapist-user-context"

export default function TherapistVerificationPage() {
  const { therapistUser } = useTherapistUser()
  const [verificationData, setVerificationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!therapistUser?.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/therapist/verification-status?therapistId=${therapistUser.id}`)
        const data = await response.json()
        setVerificationData(data)
      } catch (error) {
        console.error('Error fetching verification status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVerificationStatus()
  }, [therapistUser?.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Verification Status</h2>
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Manual Verification Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Manual Verification Process:</strong> Your ID and license verification will be reviewed manually by our admin team. 
          This process typically takes 1-3 business days. You'll be notified via email once your verification is complete.
        </AlertDescription>
      </Alert>

      {/* License Verification */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            License Verification
            <Badge variant={verificationData?.license_verified ? "default" : "secondary"}>
              {verificationData?.license_verified ? "Verified" : "Pending Review"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload your professional license or certification document for manual review by our admin team.
          </div>
          
          {verificationData?.license_document ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">License document uploaded</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Submitted on {new Date(verificationData.license_uploaded_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                placeholder="Upload license document"
              />
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload License Document
              </Button>
            </div>
          )}
          
          {verificationData?.license_verified === false && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                License verification failed. Please upload a valid license document.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ID Verification */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ID Verification
            <Badge variant={verificationData?.id_verified ? "default" : "secondary"}>
              {verificationData?.id_verified ? "Verified" : "Pending Review"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload a valid government-issued ID (passport, driver's license, or national ID) for manual verification.
          </div>
          
          {verificationData?.id_document ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">ID document uploaded</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Submitted on {new Date(verificationData.id_uploaded_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                placeholder="Upload ID document"
              />
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload ID Document
              </Button>
            </div>
          )}
          
          {verificationData?.id_verified === false && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ID verification failed. Please upload a valid government-issued ID.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Overall Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant={verificationData?.fully_verified ? "default" : "secondary"} className="text-lg px-4 py-2">
              {verificationData?.fully_verified ? "Fully Verified" : "Pending Verification"}
            </Badge>
            {!verificationData?.fully_verified && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Review in progress</span>
              </div>
            )}
          </div>
          
          {verificationData?.fully_verified && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Your account has been fully verified!</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Verified on {new Date(verificationData.verified_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Bio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Full name" defaultValue="Demo Therapist" />
            <Input placeholder="Age" defaultValue="40" />
            <Input placeholder="Gender" defaultValue="Male" />
            <Input placeholder="Marital status" defaultValue="Married" />
            <Input placeholder="Specialty" defaultValue="CBT, Trauma-Informed" />
          </div>
          <Textarea placeholder="Short bio summary" defaultValue="Licensed therapist with MBA in Psychology. Passionate about client-centered care and evidence-based practice." />
          <div className="flex justify-end">
            <Button>Save Bio</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



