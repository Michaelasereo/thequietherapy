'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePatientData } from "@/hooks/usePatientData"
import { PatientBiodata } from "@/lib/patient-data"

export default function PatientBiodataPage() {
  const { 
    biodata, 
    loading, 
    errors, 
    refreshBiodata, 
    updateBiodata 
  } = usePatientData()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingTherapy, setIsEditingTherapy] = useState(false)
  
  const [formData, setFormData] = useState<Partial<PatientBiodata>>({})
  const [therapyFormData, setTherapyFormData] = useState({
    complaints: '',
    therapist_preference: '',
  })

  // Load data on mount
  useEffect(() => {
    console.log('🔄 Biodata page: Loading data on mount')
    refreshBiodata()
  }, [refreshBiodata])

  // Update form data when biodata changes
  useEffect(() => {
    console.log('🔄 Biodata page: biodata changed:', biodata)
    if (biodata) {
      console.log('✅ Setting form data with biodata:', biodata)
      setFormData(biodata)
      setTherapyFormData({
        complaints: biodata.complaints || '',
        therapist_preference: biodata.therapist_preference || '',
      })
    }
  }, [biodata])

  const handleInputChange = (field: keyof PatientBiodata, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTherapyInputChange = (field: string, value: string) => {
    setTherapyFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    console.log('Saving biodata:', formData)
    try {
      const success = await updateBiodata(formData)
      console.log('Save result:', success)
      if (success) {
        setIsEditing(false)
        console.log('✅ Save successful, editing mode disabled')
      } else {
        console.log('❌ Save failed')
      }
    } catch (error) {
      console.error('Error in handleSave:', error)
    }
  }

  const handleTherapySave = async () => {
    console.log('Saving therapy data:', therapyFormData)
    try {
      const success = await updateBiodata({
        complaints: therapyFormData.complaints,
        therapist_preference: therapyFormData.therapist_preference,
      })
      console.log('Therapy save result:', success)
      if (success) {
        setIsEditingTherapy(false)
        console.log('✅ Therapy save successful, editing mode disabled')
      } else {
        console.log('❌ Therapy save failed')
      }
    } catch (error) {
      console.error('Error in handleTherapySave:', error)
    }
  }

  const handleCancel = () => {
    if (biodata) {
      setFormData(biodata)
    }
    setIsEditing(false)
  }

  const handleTherapyCancel = () => {
    if (biodata) {
      setTherapyFormData({
        complaints: biodata.complaints || '',
        therapist_preference: biodata.therapist_preference || '',
      })
    }
    setIsEditingTherapy(false)
  }

  if (loading.biodata && !biodata) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading patient information...</span>
      </div>
    )
  }

  if (errors.biodata) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Patient Biodata</h2>
          <p className="text-sm text-muted-foreground">Fill out your personal information</p>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading patient information: {errors.biodata}</p>
              <Button 
                onClick={refreshBiodata} 
                variant="outline" 
                className="mt-4"
                disabled={loading.biodata}
              >
                {loading.biodata && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
        <h2 className="text-2xl font-bold">Patient Biodata</h2>
        <p className="text-sm text-muted-foreground">Fill out your personal information</p>
      </div>

      {/* Personal Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              disabled={loading.biodata}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Personal Information</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={loading.biodata}
              >
                {loading.biodata ? (
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
                disabled={loading.biodata}
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  placeholder="Enter your age"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={formData.sex || ''} onValueChange={(value) => handleInputChange('sex', value as 'male' | 'female' | 'other')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  value={formData.religion || ''}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  placeholder="Enter your religion"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Enter your occupation"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select value={formData.marital_status || ''} onValueChange={(value) => handleInputChange('marital_status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="tribe">Tribe</Label>
                <Input
                  id="tribe"
                  value={formData.tribe || ''}
                  onChange={(e) => handleInputChange('tribe', e.target.value)}
                  placeholder="Enter your tribe"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="levelOfEducation">Level of Education</Label>
                <Select value={formData.level_of_education || ''} onValueChange={(value) => handleInputChange('level_of_education', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Name</p>
                <p className="text-base font-semibold">{biodata?.name || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Age</p>
                <p className="text-base font-semibold">{biodata?.age || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Sex</p>
                <p className="text-base font-semibold">{biodata?.sex || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Religion</p>
                <p className="text-base font-semibold">{biodata?.religion || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                <p className="text-base font-semibold">{biodata?.occupation || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Marital Status</p>
                <p className="text-base font-semibold">{biodata?.marital_status || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Tribe</p>
                <p className="text-base font-semibold">{biodata?.tribe || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Level of Education</p>
                <p className="text-base font-semibold">{biodata?.level_of_education || "Not provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Therapy Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Therapy Information</CardTitle>
          {!isEditingTherapy ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditingTherapy(true)}
              disabled={loading.biodata}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Therapy Information</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleTherapySave}
                disabled={loading.biodata}
              >
                {loading.biodata ? (
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
                onClick={handleTherapyCancel}
                disabled={loading.biodata}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-y-4">
          {isEditingTherapy ? (
            <>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="complaints">Complaints/Enquiry</Label>
                <Textarea
                  id="complaints"
                  value={therapyFormData.complaints}
                  onChange={(e) => handleTherapyInputChange('complaints', e.target.value)}
                  placeholder="Describe your main concerns or what brings you to therapy..."
                  rows={4}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="therapistPreference">Therapist Preference</Label>
                <Textarea
                  id="therapistPreference"
                  value={therapyFormData.therapist_preference}
                  onChange={(e) => handleTherapyInputChange('therapist_preference', e.target.value)}
                  placeholder="Any preferences for therapist gender, age, specialization, etc..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Complaints/Enquiry</p>
                <p className="text-base font-semibold">{biodata?.complaints || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Therapist Preference</p>
                <p className="text-base font-semibold">{biodata?.therapist_preference || "Not provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
