"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
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
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()

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

  const handleDocumentUpload = async (documentType: 'license' | 'id', file: File) => {
    if (!therapistUser?.id) {
      toast({
        title: "Error",
        description: "No therapist user found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(documentType)
      console.log('Uploading document:', { documentType, fileName: file.name })

      const formData = new FormData()
      formData.append('documentType', documentType)
      formData.append('file', file)

      const response = await fetch('/api/therapist/upload-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `${documentType === 'license' ? 'License' : 'ID'} document uploaded successfully!`,
        })
        
        // Refresh verification data
        const statusResponse = await fetch(`/api/therapist/verification-status?therapistId=${therapistUser.id}`)
        const statusData = await statusResponse.json()
        setVerificationData(statusData)
      } else {
        throw new Error(data.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Verification Status</h2>
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Verification Notice */}
      <Alert className="border-brand-gold bg-brand-gold/10">
        <Info className="h-4 w-4 text-brand-gold" />
        <AlertDescription className="text-gray-900">
          <strong>Manual Verification:</strong> Your license and ID verification information has been collected with your registration form and will be reviewed manually by our admin team. 
          Complete your bio information below to finish setting up your therapist profile.
        </AlertDescription>
      </Alert>

      {/* License Verification - Manual Process */}
      <Card className="shadow-sm opacity-50 pointer-events-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            License Verification
            <Badge variant="secondary">Manual Verification</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Your license information was collected during registration and is being verified manually.
          </div>
          
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              License verification is handled manually by our admin team using the information submitted in your registration form. No additional uploads are required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ID Verification - Manual Process */}
      <Card className="shadow-sm opacity-50 pointer-events-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ID Verification
            <Badge variant="secondary">Manual Verification</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Your identification information was collected during registration and is being verified manually.
          </div>
          
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              ID verification is handled manually by our admin team using the information submitted in your registration form. No additional uploads are required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Profile Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-3 p-3 bg-brand-gold/10 border border-brand-gold rounded-md">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand-gold" />
              <span className="text-sm text-gray-900 font-medium">Manual Verification In Progress</span>
            </div>
            <p className="text-xs text-gray-900 mt-2">
              Your license and ID information submitted during registration is being verified manually by our admin team. 
              Complete the Bio section below to finish setting up your therapist profile.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Bio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input placeholder="Enter your full name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Age</label>
              <Input type="number" placeholder="Enter your age" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Gender</label>
              <Input placeholder="e.g., Male, Female, Non-binary" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Marital Status</label>
              <Input placeholder="e.g., Single, Married, Divorced" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Specialization</label>
              <Input placeholder="e.g., CBT, Trauma-Informed Therapy, Depression" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Professional Bio</label>
            <Textarea 
              placeholder="Write a brief professional bio describing your experience, approach, and areas of expertise..." 
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end">
            <Button>Save Bio</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



