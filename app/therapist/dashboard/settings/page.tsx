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
  mdcnCode: z.string().optional(),
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

export default function TherapistSettingsPage() {
  const { therapistUser, validateSession } = useTherapistUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { toast } = useToast()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: therapistUser?.name ?? "",
      email: therapistUser?.email ?? "",
      phone: therapistUser?.phone ?? "",
      mdcnCode: therapistUser?.licenseNumber ?? "",
      bio: therapistUser?.bio ?? "",
      specialization: therapistUser?.specialization ?? [],
      languages: therapistUser?.languages ?? [],
      gender: therapistUser?.gender ?? "",
      maritalStatus: therapistUser?.maritalStatus ?? "",
      age: therapistUser?.age ?? "",
      sessionReminders: true,
      newClientAlerts: true,
      payoutNotifications: true,
    },
  })


  // Update form when therapistUser data changes
  useEffect(() => {
    if (therapistUser) {
      console.log('🔍 Settings: therapistUser data:', therapistUser)
      form.reset({
        name: therapistUser.name ?? "",
        email: therapistUser.email ?? "",
        phone: therapistUser.phone ?? "",
        mdcnCode: therapistUser.licenseNumber ?? "",
        bio: therapistUser.bio ?? "",
        specialization: therapistUser.specialization ?? [],
        languages: therapistUser.languages ?? [],
        gender: therapistUser.gender ?? "",
        maritalStatus: therapistUser.maritalStatus ?? "",
        age: therapistUser.age ?? "",
        sessionReminders: true,
        newClientAlerts: true,
        payoutNotifications: true,
      })
      
      // Set profile image if available
      if (therapistUser.profileImage) {
        setProfileImage(therapistUser.profileImage)
      }
    } else {
      console.log('🔍 Settings: therapistUser is null/undefined')
    }
  }, [therapistUser, form])

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setIsUploadingImage(true)
      
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await fetch('/api/therapist/upload-profile-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setProfileImage(data.imageUrl)
        toast({
          title: "Success",
          description: "Profile image uploaded successfully!",
        })
        // Refresh therapist data to get updated profile
        validateSession()
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? (error as Error).message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle image removal
  const handleImageRemove = async () => {
    try {
      setIsUploadingImage(true)
      
      const response = await fetch('/api/therapist/upload-profile-image', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setProfileImage(null)
        toast({
          title: "Success",
          description: "Profile image removed successfully!",
        })
        // Refresh therapist data to get updated profile
        validateSession()
      } else {
        throw new Error(data.error || 'Failed to remove image')
      }
    } catch (error) {
      console.error('Error removing image:', error)
      toast({
        title: "Remove failed",
        description: error instanceof Error ? (error as Error).message : "Failed to remove image",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
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

    try {
      setIsSubmitting(true)
      console.log("Updating therapist profile:", values)

      const response = await fetch('/api/therapist/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
          mdcnCode: values.mdcnCode,
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
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
        console.log("Profile updated:", data.data)
        setIsEditing(false)
        
        // Refresh the therapist user data to show updated information
        try {
          await validateSession()
        } catch (error) {
          console.error('Error refreshing therapist data:', error)
        }
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? (error as Error).message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
              <FormField
                control={form.control}
                name="mdcnCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MDCN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              
              {/* Personal Information */}
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
              </div>
              
              {/* Profile Image Upload */}
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profileImage ? (
                      <div className="relative w-24 h-24">
                        <Image
                          src={profileImage}
                          alt="Profile"
                          fill
                          className="rounded-full object-cover border-2 border-gray-200"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            disabled={isUploadingImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
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
                        disabled={isUploadingImage}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, WebP up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </FormItem>
              
              {/* Specializations - Editable in edit mode */}
              {isEditing ? (
                <FormField
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
                    {therapistUser?.specialization?.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    )) || <p className="text-sm text-muted-foreground">No specializations listed</p>}
                  </div>
                </div>
              )}

              {/* Languages - Editable in edit mode */}
              {isEditing ? (
                <FormField
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
                    {therapistUser?.languages?.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        {lang}
                      </Badge>
                    )) || <p className="text-sm text-muted-foreground">No languages listed</p>}
                  </div>
                </div>
              )}
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
                        // Reset form to original values
                        if (therapistUser) {
                          form.reset({
                            name: therapistUser.name ?? "",
                            email: therapistUser.email ?? "",
                            phone: therapistUser.phone ?? "",
                            mdcnCode: therapistUser.licenseNumber ?? "",
                            bio: therapistUser.bio ?? "",
                            specialization: therapistUser.specialization ?? [],
                            languages: therapistUser.languages ?? [],
                            gender: therapistUser.gender ?? "",
                            maritalStatus: therapistUser.maritalStatus ?? "",
                            age: therapistUser.age ?? "",
                            sessionReminders: true,
                            newClientAlerts: true,
                            payoutNotifications: true,
                          })
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


