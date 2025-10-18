"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useTherapistUser } from "@/context/therapist-user-context"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Upload, X, Camera } from "lucide-react"
import { therapistEvents, THERAPIST_EVENTS } from "@/lib/events"

// Predefined options for specializations and languages
const SPECIALIZATION_OPTIONS = [
  "Anxiety Disorders",
  "Depression",
  "Trauma and PTSD",
  "Relationship Counseling",
  "Family Therapy",
  "Cognitive Behavioral Therapy (CBT)",
  "Dialectical Behavior Therapy (DBT)",
  "Addiction Counseling",
  "Grief and Loss",
  "Stress Management",
  "Anger Management",
  "Self-Esteem Issues",
  "Career Counseling",
  "LGBTQ+ Support",
  "Child and Adolescent Therapy",
  "Couples Therapy",
  "Group Therapy",
  "Mindfulness-Based Therapy",
  "Art Therapy",
  "Play Therapy"
]

const LANGUAGE_OPTIONS = [
  "English",
  "Yoruba",
  "Igbo", 
  "Hausa",
  "French",
  "Spanish",
  "Portuguese",
  "Arabic",
  "Chinese",
  "Hindi",
  "German",
  "Italian",
  "Dutch",
  "Swahili",
  "Amharic",
  "Twi",
  "Wolof",
  "Fulani",
  "Zulu",
  "Xhosa"
]

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  licensedQualification: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  age: z.string().optional(),
  sessionReminders: z.boolean(),
  newClientAlerts: z.boolean(),
  payoutNotifications: z.boolean(),
})

type SettingsFormValues = z.infer<typeof formSchema>

// Helper component to show field edit status
function FieldEditIndicator({ fieldName, isEdited, originalValue }: { 
  fieldName: string
  isEdited: boolean
  originalValue: any 
}) {
  if (!originalValue && !isEdited) return null
  
  return (
    <div className="flex items-center gap-2 mt-1">
      {isEdited ? (
        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
          <Check className="h-3 w-3 mr-1" />
          Custom value
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs text-gray-600">
          Using enrollment default
        </Badge>
      )}
      {originalValue && (
        <span className="text-xs text-muted-foreground">
          Original: {typeof originalValue === 'object' ? JSON.stringify(originalValue) : originalValue}
        </span>
      )}
    </div>
  )
}

export default function TherapistSettingsPage() {
  const { therapistUser, validateSession, updateTherapist } = useTherapistUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [loadingEnrollment, setLoadingEnrollment] = useState(true)
  const [formKey, setFormKey] = useState(0)
  const [justSaved, setJustSaved] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const { toast } = useToast()
  
  // Store original image for rollback on error
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null)

  // Safe logging - only log when context is ready
  useEffect(() => {
    if (therapistUser && therapistUser.edited_fields) {
      console.log('🔍 Settings: Edit tracking data:', {
        editedFields: therapistUser?.edited_fields,
        originalData: therapistUser?.original_enrollment_data,
        profileUpdatedAt: therapistUser?.profile_updated_at
      })
    }
  }, [therapistUser])

  // Force image refresh when profile image URL changes
  useEffect(() => {
    if (profileImage) {
      console.log('🔄 Settings: Profile image changed, incrementing version')
      setImageVersion(prev => prev + 1)
    }
  }, [profileImage])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: therapistUser?.full_name ?? "",
      email: therapistUser?.email ?? "",
      phone: "",
      licensedQualification: therapistUser?.license_number ?? "",
      bio: therapistUser?.bio ?? "",
      specialization: therapistUser?.specialization ? [therapistUser.specialization] : [],
      languages: [],
      gender: "",
      maritalStatus: "",
      age: "",
      sessionReminders: true,
      newClientAlerts: true,
      payoutNotifications: true,
    },
  })

  // Fetch enrollment data
  const fetchEnrollmentData = async () => {
    if (!therapistUser?.id) return

    try {
      setLoadingEnrollment(true)
      const response = await fetch('/api/therapist/profile')
      const data = await response.json()
      
      console.log('🔍 Settings: API Response:', data)
      
      if (data.success && data.data?.therapist) {
        const therapist = data.data.therapist
        setEnrollmentData(therapist)
        console.log('🔍 Settings: Profile data loaded:', therapist)
        setFormKey(prev => prev + 1) // Force re-render of form fields
        console.log('🔍 Settings: Field values:', {
          phone: therapist.phone,
          bio: therapist.bio,
          gender: therapist.gender,
          age: therapist.age,
          maritalStatus: therapist.maritalStatus,
          specialization: therapist.specialization,
          languages: therapist.languages,
          profile_image_url: therapist.profile_image_url
        })
        
        console.log('🔍 Settings: Specialization type:', typeof therapist.specialization, therapist.specialization)
        console.log('🔍 Settings: Languages type:', typeof therapist.languages, therapist.languages)
      } else {
        console.error('🔍 Settings: API response not successful or no therapist data')
      }
    } catch (error) {
      console.error('❌ Settings: Error fetching profile data:', error)
    } finally {
      setLoadingEnrollment(false)
    }
  }


  // Fetch enrollment data on component mount
  useEffect(() => {
    console.log('🔍 Settings: Component mounted - therapistEvents instance:', {
      instance: therapistEvents,
      eventNames: THERAPIST_EVENTS
    })
    fetchEnrollmentData()
  }, [therapistUser?.id])

  // Update form when enrollment data is loaded
  useEffect(() => {
    // Don't reset form if we just saved (to prevent clearing newly saved data)
    if (justSaved) {
      console.log('🔍 Settings: Skipping form reset because we just saved')
      return
    }
    
    if (enrollmentData) {
      console.log('🔍 Settings: Enrollment data loaded, updating form:', enrollmentData)
      
      // Parse languages - try multiple possible formats
      let languages = []
      if (enrollmentData.languages_array) {
        languages = enrollmentData.languages_array
      } else if (enrollmentData.languages) {
        try {
          if (typeof enrollmentData.languages === 'string') {
            // Try to parse as JSON first
            try {
              languages = JSON.parse(enrollmentData.languages)
            } catch {
              // If not JSON, split by comma
              languages = enrollmentData.languages.split(',').map((lang: string) => lang.trim())
            }
          } else if (Array.isArray(enrollmentData.languages)) {
            languages = enrollmentData.languages
          }
        } catch (e) {
          console.error('Error parsing languages:', e)
          languages = []
        }
      }
      console.log('🔍 Settings: Parsed languages:', languages)

      // Parse specialization - try multiple possible formats
      let specialization = []
      if (enrollmentData.specializations) {
        specialization = enrollmentData.specializations
      } else if (enrollmentData.specialization) {
        if (typeof enrollmentData.specialization === 'string') {
          // Try to parse as JSON first
          try {
            specialization = JSON.parse(enrollmentData.specialization)
          } catch {
            // If not JSON, split by comma
            specialization = enrollmentData.specialization.split(',').map((spec: string) => spec.trim())
          }
        } else if (Array.isArray(enrollmentData.specialization)) {
          specialization = enrollmentData.specialization
        }
      }
      console.log('🔍 Settings: Parsed specialization:', specialization)

      const formValues = {
        name: enrollmentData.full_name ?? therapistUser?.full_name ?? "",
        email: enrollmentData.email ?? therapistUser?.email ?? "",
        phone: enrollmentData.phone ?? "",
        licensedQualification: enrollmentData.license_number ?? enrollmentData.mdcn_code ?? "",
        bio: enrollmentData.bio ?? "",
        specialization: specialization,
        languages: languages,
        gender: enrollmentData.gender ?? "",
        maritalStatus: enrollmentData.maritalStatus ?? enrollmentData.marital_status ?? "",
        age: enrollmentData.age?.toString() ?? "",
        sessionReminders: true,
        newClientAlerts: true,
        payoutNotifications: true,
      }
      
      console.log('🔍 Settings: Resetting form with values:', formValues)
      form.reset(formValues)
      
      // Force re-render of FormField components by updating the key
      setFormKey(prev => prev + 1)
      console.log('🔍 Settings: Updated formKey to force re-render')
      
      // Set profile image if available
      if (enrollmentData.profile_image_url || therapistUser?.profile_image_url) {
        setProfileImage(enrollmentData.profile_image_url || therapistUser?.profile_image_url)
      }
    } else if (therapistUser) {
      // Fallback to basic therapist user data
      console.log('🔍 Settings: Using basic therapistUser data:', therapistUser)
      form.reset({
        name: therapistUser.full_name ?? "",
        email: therapistUser.email ?? "",
        phone: "",
        licensedQualification: therapistUser.license_number ?? "",
        bio: therapistUser.bio ?? "",
        specialization: therapistUser.specialization ? [therapistUser.specialization] : [],
        languages: [],
        gender: "",
        maritalStatus: "",
        age: "",
        sessionReminders: true,
        newClientAlerts: true,
        payoutNotifications: true,
      })
      
      // Set profile image if available
      if (therapistUser.profile_image_url) {
        setProfileImage(therapistUser.profile_image_url)
      }
    }
  }, [enrollmentData, therapistUser, form, justSaved])

  // Handle image selection (preview only, upload on save)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Store the file for later upload
    setPendingImageFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPendingImagePreview(previewUrl)
    
    toast({
      title: "Image selected",
      description: "Click 'Save Changes' to upload your profile picture.",
    })
  }

  // Handle image removal (clear pending or mark for deletion)
  const handleImageRemove = () => {
    // Clear pending image if there is one
    if (pendingImageFile || pendingImagePreview) {
      setPendingImageFile(null)
      setPendingImagePreview(null)
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview)
      }
      toast({
        title: "Image cleared",
        description: "Profile image selection cleared.",
      })
    } else {
      // Mark existing image for removal
      setProfileImage(null)
      toast({
        title: "Image marked for removal",
        description: "Click 'Save Changes' to remove your profile picture.",
      })
    }
  }

  async function onSubmit(values: SettingsFormValues) {
    if (!therapistUser?.id) {
      toast({
        title: "Error",
        description: "No therapist user found. Please log in again.",
        variant: "destructive",
      })
      return
    }
    
    if (loadingEnrollment) {
      toast({
        title: "Please wait",
        description: "Profile data is still loading. Please try again.",
        variant: "default",
      })
      return
    }

    // Store original values for rollback
    setOriginalProfileImage(profileImage)
    const originalPreview = pendingImagePreview
    
    try {
      setIsSubmitting(true)
      console.log("💾 Updating therapist profile:", values)

      // 🚀 STEP 1: OPTIMISTIC UPDATE - Update UI immediately
      if (pendingImagePreview && pendingImageFile) {
        console.log("⚡ Optimistic update: Setting preview image immediately")
        setProfileImage(pendingImagePreview)
        
        // Update context immediately (optimistic)
        updateTherapist({
          profile_image_url: pendingImagePreview
        })
        
        // Emit event for instant updates across all components
        therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
          profile_image_url: pendingImagePreview
        })
      }

      // 🔼 STEP 2: Upload image if pending
      let uploadedImageUrl = profileImage
      if (pendingImageFile) {
        try {
          console.log("📤 Uploading image to server...")
          const formData = new FormData()
          formData.append('profileImage', pendingImageFile)

          const imageResponse = await fetch('/api/therapist/upload-profile-image', {
            method: 'POST',
            body: formData,
          })

          const imageData = await imageResponse.json()

          if (imageResponse.ok && imageData.success) {
            uploadedImageUrl = imageData.imageUrl
            console.log("✅ Profile image uploaded:", uploadedImageUrl)
            
            // Update with real URL
            setProfileImage(uploadedImageUrl)
            
            // Update context with real URL
            updateTherapist({
              profile_image_url: uploadedImageUrl || undefined
            })
            
            // Emit event with real URL
            console.log('🔄 Settings: Profile update successful, emitting event...')
            console.log('🔄 Settings: New image URL:', uploadedImageUrl)
            console.log('📸 Settings: Emitting AVATAR_UPDATED event with URL:', uploadedImageUrl)
            
            // Emit the event with detailed data
            therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
              profile_image_url: uploadedImageUrl,
              timestamp: Date.now(),
              source: 'settings-page'
            })
            
            console.log('✅ Settings: Event emitted successfully')
          } else {
            throw new Error(imageData.error || 'Failed to upload image')
          }
        } catch (imageError) {
          console.error('❌ Error uploading image:', imageError)
          
          // Rollback optimistic update
          setProfileImage(originalProfileImage)
          updateTherapist({
            profile_image_url: originalProfileImage || undefined
          })
          therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
            profile_image_url: originalProfileImage || ''
          })
          
          toast({
            title: "Image upload failed",
            description: imageError instanceof Error ? imageError.message : "Failed to upload profile image",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // 📝 STEP 3: Update profile data
      console.log("📝 Updating profile data...")
      const response = await fetch('/api/therapist/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
          mdcnCode: values.licensedQualification,
          bio: values.bio,
          specialization: values.specialization,
          languages: values.languages,
          gender: values.gender,
          maritalStatus: values.maritalStatus,
          age: values.age,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("✅ Profile updated successfully")
        
        // Clean up pending image state
        setPendingImageFile(null)
        if (pendingImagePreview) {
          URL.revokeObjectURL(pendingImagePreview)
          setPendingImagePreview(null)
        }
        
        // Update context with all new data
        updateTherapist({
          bio: values.bio,
          license_number: values.licensedQualification,
          profile_image_url: uploadedImageUrl || undefined
        })
        
        // Emit comprehensive profile update event
        therapistEvents.emit(THERAPIST_EVENTS.PROFILE_UPDATED, {
          ...values,
          profile_image_url: uploadedImageUrl
        })
        
        // Refresh enrollment data (background refresh, non-blocking)
        fetchEnrollmentData().catch(err => console.error('Background refresh failed:', err))
        
        // Exit edit mode
        setIsEditing(false)
        
        toast({
          title: "Success! ✨",
          description: "Profile updated instantly across all pages",
        })
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      
      // Rollback all optimistic updates on error
      setProfileImage(originalProfileImage)
      if (originalPreview) {
        setPendingImagePreview(originalPreview)
      }
      updateTherapist({
        profile_image_url: originalProfileImage || undefined
      })
      therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
        profile_image_url: originalProfileImage || ''
      })
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingEnrollment) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading profile data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Profile Image Upload - TOP PRIORITY */}
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {(pendingImagePreview || profileImage) ? (
                      <div className="relative w-24 h-24">
                        <Image
                          src={pendingImagePreview || profileImage || ''}
                          alt="Profile"
                          fill
                          className="rounded-full object-cover border-2 border-gray-200"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {pendingImagePreview && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                            New
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        {pendingImageFile ? 'Change Image' : 'Upload Image'}
                      </label>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, WebP up to 5MB
                      </p>
                      {pendingImageFile && (
                        <p className="text-xs text-blue-600 font-medium">
                          Click Save to upload
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </FormItem>
              
              {/* Core Profile Information */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Name cannot be changed</p>
                  </FormItem>
                )}
              />
              
              {/* Personal Information - Gender, Age, Marital Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Non-binary">Non-binary</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter age" 
                          {...field} 
                          disabled={!isEditing}
                          type="number"
                          min="18"
                          max="100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Separated">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Contact Information */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Professional Information */}
              <FormField
                control={form.control}
                name="licensedQualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licensed Qualification</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MD, DO, PhD, Licensed Therapist" {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Specializations - Editable in edit mode */}
              {isEditing ? (
                <FormField
                  key={`specialization-${formKey}`}
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specializations</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} specialization(s) selected`
                                : "Select specializations..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search specializations..." />
                            <CommandEmpty>No specializations found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {SPECIALIZATION_OPTIONS.map((spec) => (
                                <CommandItem
                                  key={spec}
                                  value={spec}
                                  onSelect={() => {
                                    const currentValues = field.value || []
                                    const newValues = currentValues.includes(spec)
                                      ? currentValues.filter((item: string) => item !== spec)
                                      : [...currentValues, spec]
                                    field.onChange(newValues)
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value?.includes(spec) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {spec}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value?.map((spec: string) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = (field.value || []).filter((item: string) => item !== spec)
                                field.onChange(newValues)
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <FormLabel>Specializations</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {therapistUser?.specialization ? (
                      <Badge variant="secondary">
                        {therapistUser.specialization}
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specializations listed</p>
                    )}
                  </div>
                </div>
              )}

              {/* Languages - Editable in edit mode */}
              {isEditing ? (
                <FormField
                  key={`languages-${formKey}`}
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} language(s) selected`
                                : "Select languages..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search languages..." />
                            <CommandEmpty>No languages found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {LANGUAGE_OPTIONS.map((lang) => (
                                <CommandItem
                                  key={lang}
                                  value={lang}
                                  onSelect={() => {
                                    const currentValues = field.value || []
                                    const newValues = currentValues.includes(lang)
                                      ? currentValues.filter((item: string) => item !== lang)
                                      : [...currentValues, lang]
                                    field.onChange(newValues)
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value?.includes(lang) ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {lang}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value?.map((lang: string) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = (field.value || []).filter((item: string) => item !== lang)
                                field.onChange(newValues)
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <FormLabel>Languages</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-sm text-muted-foreground">No languages listed</p>
                  </div>
                </div>
              )}
              
              {/* Professional Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell clients about your experience, approach, and specialties..."
                        className="min-h-[120px]"
                        disabled={!isEditing}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notification Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionReminders"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Session reminders</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newClientAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>New client alerts</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payoutNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Payout notifications</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault()
                      setIsEditing(true)
                    }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => {
                        e.preventDefault()
                        setIsEditing(false)
                        
                        // Clear pending image
                        if (pendingImagePreview) {
                          URL.revokeObjectURL(pendingImagePreview)
                        }
                        setPendingImageFile(null)
                        setPendingImagePreview(null)
                        
                        // Reset form to original enrollment values
                        if (enrollmentData) {
                          // Parse languages - try multiple possible formats
                          let languages = []
                          if (enrollmentData.languages_array) {
                            languages = enrollmentData.languages_array
                          } else if (enrollmentData.languages) {
                            try {
                              if (typeof enrollmentData.languages === 'string') {
                                try {
                                  languages = JSON.parse(enrollmentData.languages)
                                } catch {
                                  languages = enrollmentData.languages.split(',').map((lang: string) => lang.trim())
                                }
                              } else {
                                languages = enrollmentData.languages
                              }
                            } catch (e) {
                              languages = []
                            }
                          }

                          // Parse specialization - try multiple possible formats
                          let specialization = []
                          if (enrollmentData.specializations) {
                            specialization = enrollmentData.specializations
                          } else if (enrollmentData.specialization) {
                            if (typeof enrollmentData.specialization === 'string') {
                              try {
                                specialization = JSON.parse(enrollmentData.specialization)
                              } catch {
                                specialization = enrollmentData.specialization.split(',').map((spec: string) => spec.trim())
                              }
                            } else {
                              specialization = enrollmentData.specialization
                            }
                          }

                          form.reset({
                            name: enrollmentData.full_name ?? "",
                            email: enrollmentData.email ?? "",
                            phone: enrollmentData.phone ?? "",
                            licensedQualification: enrollmentData.license_number ?? enrollmentData.mdcn_code ?? "",
                            bio: enrollmentData.bio ?? "",
                            specialization: specialization,
                            languages: languages,
                            gender: enrollmentData.gender ?? "",
                            maritalStatus: enrollmentData.maritalStatus ?? enrollmentData.marital_status ?? "",
                            age: enrollmentData.age?.toString() ?? "",
                            sessionReminders: true,
                            newClientAlerts: true,
                            payoutNotifications: true,
                          })
                          
                          // Reset profile image to original
                          if (enrollmentData.profile_image_url || therapistUser?.profile_image_url) {
                            setProfileImage(enrollmentData.profile_image_url || therapistUser?.profile_image_url)
                          }
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

    </div>
  )
}


