'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePatientData } from "@/hooks/usePatientData"
import { PatientBiodata } from "@/lib/client-data"

// Therapy specializations for preferences
const therapySpecializations = [
  "Anxiety & Stress Management",
  "Depression & Mood Disorders",
  "Relationship & Family Therapy",
  "Trauma & PTSD",
  "Addiction & Recovery",
  "Cognitive Behavioral Therapy (CBT)",
  "Grief Counseling",
  "Adolescent Therapy"
] as const

// Countries list
const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Ethiopia",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Cameroon",
  "Senegal",
  "Ivory Coast",
  "Mali",
  "Burkina Faso",
  "Niger",
  "Chad",
  "Sudan",
  "Somalia",
  "Djibouti",
  "Eritrea",
  "Libya",
  "Mauritania",
  "Gambia",
  "Guinea-Bissau",
  "Sierra Leone",
  "Liberia",
  "Togo",
  "Benin",
  "Central African Republic",
  "Gabon",
  "Congo",
  "Democratic Republic of the Congo",
  "Angola",
  "Zambia",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "Lesotho",
  "Eswatini",
  "Madagascar",
  "Mauritius",
  "Seychelles",
  "Comoros",
  "Cape Verde",
  "São Tomé and Príncipe",
  "Equatorial Guinea",
  "Guinea",
  "Burundi",
  "Malawi",
  "Mozambique",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Portugal",
  "Greece",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Slovakia",
  "Slovenia",
  "Croatia",
  "Serbia",
  "Bosnia and Herzegovina",
  "Montenegro",
  "Albania",
  "North Macedonia",
  "Bulgaria",
  "Romania",
  "Moldova",
  "Ukraine",
  "Belarus",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Russia",
  "Turkey",
  "Cyprus",
  "Malta",
  "Iceland",
  "Luxembourg",
  "Liechtenstein",
  "Monaco",
  "Andorra",
  "San Marino",
  "Vatican City",
  "Australia",
  "New Zealand",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Singapore",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Indonesia",
  "Myanmar",
  "Cambodia",
  "Laos",
  "Brunei",
  "East Timor",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Bhutan",
  "Maldives",
  "Afghanistan",
  "Iran",
  "Iraq",
  "Syria",
  "Lebanon",
  "Jordan",
  "Israel",
  "Palestine",
  "Saudi Arabia",
  "Yemen",
  "Oman",
  "United Arab Emirates",
  "Qatar",
  "Bahrain",
  "Kuwait",
  "Kazakhstan",
  "Uzbekistan",
  "Turkmenistan",
  "Kyrgyzstan",
  "Tajikistan",
  "Azerbaijan",
  "Georgia",
  "Armenia",
  "Mongolia",
  "Brazil",
  "Argentina",
  "Chile",
  "Peru",
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Guyana",
  "Suriname",
  "French Guiana",
  "Mexico",
  "Guatemala",
  "Belize",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  "Cuba",
  "Jamaica",
  "Haiti",
  "Dominican Republic",
  "Puerto Rico",
  "Trinidad and Tobago",
  "Barbados",
  "Grenada",
  "Saint Vincent and the Grenadines",
  "Saint Lucia",
  "Dominica",
  "Antigua and Barbuda",
  "Saint Kitts and Nevis",
  "Bahamas",
  "Other"
]

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
    therapist_preference: [] as string[],
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
      
      // Parse therapist_preference if it's a string
      let preferences: string[] = []
      if (biodata.therapist_preference) {
        if (typeof biodata.therapist_preference === 'string') {
          try {
            preferences = JSON.parse(biodata.therapist_preference)
          } catch {
            preferences = biodata.therapist_preference.split(',').map(p => p.trim()).filter(p => p)
          }
        } else if (Array.isArray(biodata.therapist_preference)) {
          preferences = biodata.therapist_preference
        }
      }
      
      setTherapyFormData({
        complaints: biodata.complaints || '',
        therapist_preference: preferences,
      })
    }
  }, [biodata])

  const handleInputChange = (field: keyof PatientBiodata, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTherapyInputChange = (field: string, value: string) => {
    setTherapyFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTherapyPreferenceToggle = (preference: string) => {
    setTherapyFormData(prev => {
      const currentPrefs = prev.therapist_preference || []
      const newPrefs = currentPrefs.includes(preference)
        ? currentPrefs.filter(p => p !== preference)
        : [...currentPrefs, preference]
      return { ...prev, therapist_preference: newPrefs }
    })
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
      // Convert array to JSON string for storage
      const preferenceValue = Array.isArray(therapyFormData.therapist_preference) 
        ? JSON.stringify(therapyFormData.therapist_preference)
        : therapyFormData.therapist_preference
      
      const success = await updateBiodata({
        complaints: therapyFormData.complaints,
        therapist_preference: preferenceValue,
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
      // Parse therapist_preference for cancellation
      let preferences: string[] = []
      if (biodata.therapist_preference) {
        if (typeof biodata.therapist_preference === 'string') {
          try {
            preferences = JSON.parse(biodata.therapist_preference)
          } catch {
            preferences = biodata.therapist_preference.split(',').map(p => p.trim()).filter(p => p)
          }
        } else if (Array.isArray(biodata.therapist_preference)) {
          preferences = biodata.therapist_preference
        }
      }
      
      setTherapyFormData({
        complaints: biodata.complaints || '',
        therapist_preference: preferences,
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
              {/* Contact Information */}
              <div className="col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country || ''} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Contact Information Display */}
              <div className="col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <p className="font-medium text-sm text-muted-foreground">First Name</p>
                    <p className="text-base font-semibold">{biodata?.firstName || "Not provided"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm text-muted-foreground">Email Address</p>
                    <p className="text-base font-semibold">{biodata?.email || "Not provided"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm text-muted-foreground">Phone Number</p>
                    <p className="text-base font-semibold">{biodata?.phone || "Not provided"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm text-muted-foreground">Country</p>
                    <p className="text-base font-semibold">{biodata?.country || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information Display */}
              <div className="col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="font-medium text-sm text-muted-foreground">Level of Education</p>
                    <p className="text-base font-semibold">{biodata?.level_of_education || "Not provided"}</p>
                  </div>
                </div>
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
                <Label>Therapist Specialization Preferences (Optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {therapySpecializations.map((specialization) => (
                    <div key={specialization} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialization}
                        checked={therapyFormData.therapist_preference?.includes(specialization)}
                        onCheckedChange={() => handleTherapyPreferenceToggle(specialization)}
                      />
                      <Label
                        htmlFor={specialization}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {specialization}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground">Complaints/Enquiry</p>
                <p className="text-base font-semibold">{biodata?.complaints || "Not provided"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-muted-foreground mb-2">Therapist Specialization Preferences</p>
                {(() => {
                  // Parse therapist_preference for display
                  let preferences: string[] = []
                  if (biodata?.therapist_preference) {
                    if (typeof biodata.therapist_preference === 'string') {
                      try {
                        preferences = JSON.parse(biodata.therapist_preference)
                      } catch {
                        preferences = biodata.therapist_preference.split(',').map(p => p.trim()).filter(p => p)
                      }
                    } else if (Array.isArray(biodata.therapist_preference)) {
                      preferences = biodata.therapist_preference
                    }
                  }
                  
                  return preferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {preferences.map((pref) => (
                        <span key={pref} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pref}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base font-semibold">No preferences selected</p>
                  )
                })()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
