'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePatientData } from "@/hooks/usePatientData"
import { PatientFamilyHistory } from "@/lib/patient-data"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

export default function FamilyHistoryPage() {
  const { 
    familyHistory, 
    loading, 
    errors, 
    refreshFamilyHistory, 
    updateFamilyHistory 
  } = usePatientData()
  
  const { user } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<PatientFamilyHistory>>({})

  // Load data on mount
  useEffect(() => {
    refreshFamilyHistory()
  }, [refreshFamilyHistory])

  // Update form data when family history changes
  useEffect(() => {
    if (familyHistory) {
      setFormData(familyHistory)
    }
  }, [familyHistory])

  const handleInputChange = (field: keyof PatientFamilyHistory, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const success = await updateFamilyHistory(formData)
    if (success) {
      setIsEditing(false)
      toast.success('Family history updated successfully')
      
      // Create sidebar notification via API
      if (user?.id) {
        try {
          const response = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              user_type: 'individual',
              title: 'Family History Updated',
              message: 'Your family medical and mental health history has been updated successfully.',
              type: 'success',
              category: 'general',
              action_url: '/dashboard/family-history',
              metadata: { updated_at: new Date().toISOString() }
            })
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('Failed to create notification:', result)
          }
        } catch (error) {
          console.error('Error creating notification:', error)
        }
      }
    } else {
      toast.error('Failed to update family history')
    }
  }

  const handleCancel = () => {
    if (familyHistory) {
      setFormData(familyHistory)
    }
    setIsEditing(false)
  }

  if (loading.familyHistory && !familyHistory) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Family History</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your family history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (errors.familyHistory) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Family History</h2>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading family history: {errors.familyHistory}</p>
              <Button 
                onClick={refreshFamilyHistory} 
                variant="outline" 
                className="mt-4"
                disabled={loading.familyHistory}
              >
                {loading.familyHistory && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Family History</h2>
        <p className="text-sm text-muted-foreground">Share your family's medical and mental health history</p>
      </div>

      <Card className="shadow-sm relative">
        {loading.familyHistory && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Updating...</p>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Family Medical & Mental Health History</CardTitle>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              disabled={loading.familyHistory}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Family History</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={loading.familyHistory}
              >
                {loading.familyHistory ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                disabled={loading.familyHistory}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-4">
          {isEditing ? (
            <>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="mental_health_history">Mental Health History</Label>
                <Textarea
                  id="mental_health_history"
                  value={formData.mental_health_history || ''}
                  onChange={(e) => handleInputChange('mental_health_history', e.target.value)}
                  placeholder="Describe any mental health conditions in your family (e.g., depression, anxiety, bipolar disorder)..."
                  rows={4}
                  disabled={loading.familyHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="substance_abuse_history">Substance Abuse History</Label>
                <Textarea
                  id="substance_abuse_history"
                  value={formData.substance_abuse_history || ''}
                  onChange={(e) => handleInputChange('substance_abuse_history', e.target.value)}
                  placeholder="Describe any history of substance abuse in your family (alcohol, drugs, etc.)..."
                  rows={4}
                  disabled={loading.familyHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="other_medical_history">Other Medical History</Label>
                <Textarea
                  id="other_medical_history"
                  value={formData.other_medical_history || ''}
                  onChange={(e) => handleInputChange('other_medical_history', e.target.value)}
                  placeholder="Describe any other medical conditions that run in your family (diabetes, heart disease, cancer, etc.)..."
                  rows={4}
                  disabled={loading.familyHistory}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Mental Health History</p>
                <p className="text-base font-semibold">{familyHistory?.mental_health_history || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Substance Abuse History</p>
                <p className="text-base font-semibold">{familyHistory?.substance_abuse_history || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Other Medical History</p>
                <p className="text-base font-semibold">{familyHistory?.other_medical_history || "Not provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
