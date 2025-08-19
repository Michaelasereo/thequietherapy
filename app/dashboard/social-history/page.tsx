'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePatientData } from "@/hooks/usePatientData"
import { PatientSocialHistory } from "@/lib/patient-data"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

export default function SocialHistoryPage() {
  const { 
    socialHistory, 
    loading, 
    errors, 
    refreshSocialHistory, 
    updateSocialHistory 
  } = usePatientData()
  
  const { user } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<PatientSocialHistory>>({})

  // Load data on mount
  useEffect(() => {
    refreshSocialHistory()
  }, [refreshSocialHistory])

  // Update form data when social history changes
  useEffect(() => {
    if (socialHistory) {
      setFormData(socialHistory)
    }
  }, [socialHistory])

  const handleInputChange = (field: keyof PatientSocialHistory, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const success = await updateSocialHistory(formData)
    if (success) {
      setIsEditing(false)
      toast.success('Social history updated successfully')
      
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
              title: 'Social History Updated',
              message: 'Your social history and lifestyle information has been updated successfully.',
              type: 'success',
              category: 'general',
              action_url: '/dashboard/social-history',
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
      toast.error('Failed to update social history')
    }
  }

  const handleCancel = () => {
    if (socialHistory) {
      setFormData(socialHistory)
    }
    setIsEditing(false)
  }

  if (loading.socialHistory && !socialHistory) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Social History</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your social history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (errors.socialHistory) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Social History</h2>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading social history: {errors.socialHistory}</p>
              <Button 
                onClick={refreshSocialHistory} 
                variant="outline" 
                className="mt-4"
                disabled={loading.socialHistory}
              >
                {loading.socialHistory && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
        <h2 className="text-2xl font-bold">Social History</h2>
        <p className="text-sm text-muted-foreground">Share your lifestyle, relationships, and social background</p>
      </div>

      {/* Lifestyle & Relationships Card */}
      <Card className="shadow-sm relative">
        {loading.socialHistory && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Updating...</p>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Lifestyle & Relationships</CardTitle>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              disabled={loading.socialHistory}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Social History</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={loading.socialHistory}
              >
                {loading.socialHistory ? (
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
                disabled={loading.socialHistory}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {isEditing ? (
            <>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="living_situation">Living Situation</Label>
                <Input
                  id="living_situation"
                  value={formData.living_situation || ''}
                  onChange={(e) => handleInputChange('living_situation', e.target.value)}
                  placeholder="e.g., Lives alone in an apartment"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="employment">Employment</Label>
                <Input
                  id="employment"
                  value={formData.employment || ''}
                  onChange={(e) => handleInputChange('employment', e.target.value)}
                  placeholder="e.g., Full-time software engineer"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="relationships">Relationships</Label>
                <Input
                  id="relationships"
                  value={formData.relationships || ''}
                  onChange={(e) => handleInputChange('relationships', e.target.value)}
                  placeholder="e.g., Close relationship with sister"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="hobbies_interests">Hobbies & Interests</Label>
                <Input
                  id="hobbies_interests"
                  value={formData.hobbies_interests || ''}
                  onChange={(e) => handleInputChange('hobbies_interests', e.target.value)}
                  placeholder="e.g., Reading, hiking, video games"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2 sm:col-span-2">
                <Label htmlFor="stressors">Current Stressors</Label>
                <Textarea
                  id="stressors"
                  value={formData.stressors || ''}
                  onChange={(e) => handleInputChange('stressors', e.target.value)}
                  placeholder="Describe current sources of stress in your life..."
                  rows={3}
                  disabled={loading.socialHistory}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Living Situation</p>
                <p className="text-base font-semibold">{socialHistory?.living_situation || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Employment</p>
                <p className="text-base font-semibold">{socialHistory?.employment || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Relationships</p>
                <p className="text-base font-semibold">{socialHistory?.relationships || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Hobbies & Interests</p>
                <p className="text-base font-semibold">{socialHistory?.hobbies_interests || "Not provided"}</p>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <p className="font-medium text-sm text-muted-foreground">Stressors</p>
                <p className="text-base font-semibold">{socialHistory?.stressors || "Not provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Substance Use History Card */}
      <Card className="shadow-sm relative">
        {loading.socialHistory && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Updating...</p>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Substance Use History</CardTitle>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              disabled={loading.socialHistory}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Substance Use History</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={loading.socialHistory}
              >
                {loading.socialHistory ? (
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
                disabled={loading.socialHistory}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {isEditing ? (
            <>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="smoking_history">Smoking History</Label>
                <Input
                  id="smoking_history"
                  value={formData.smoking_history || ''}
                  onChange={(e) => handleInputChange('smoking_history', e.target.value)}
                  placeholder="e.g., No history of smoking"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="alcohol_history">Alcohol History</Label>
                <Input
                  id="alcohol_history"
                  value={formData.alcohol_history || ''}
                  onChange={(e) => handleInputChange('alcohol_history', e.target.value)}
                  placeholder="e.g., Occasional social drinking"
                  disabled={loading.socialHistory}
                />
              </div>
              <div className="flex flex-col space-y-2 sm:col-span-2">
                <Label htmlFor="other_drugs_history">Other Drug Use</Label>
                <Textarea
                  id="other_drugs_history"
                  value={formData.other_drugs_history || ''}
                  onChange={(e) => handleInputChange('other_drugs_history', e.target.value)}
                  placeholder="Describe any history of other drug use..."
                  rows={3}
                  disabled={loading.socialHistory}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Smoking</p>
                <p className="text-base font-semibold">{socialHistory?.smoking_history || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Alcohol</p>
                <p className="text-base font-semibold">{socialHistory?.alcohol_history || "Not provided"}</p>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <p className="font-medium text-sm text-muted-foreground">Other Drug Use</p>
                <p className="text-base font-semibold">{socialHistory?.other_drugs_history || "Not provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
