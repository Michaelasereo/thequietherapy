"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEffect } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
// Therapists data - moved from lib/data.ts (empty array since therapists are fetched from API)
const therapists: any[] = []

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  country: z.string().min(1, { message: "Please select your country." }),
  complaints: z.string().min(10, { message: "Please describe your concerns in more detail." }),
  age: z.string().min(1, { message: "Age is required." }),
  gender: z.enum(["Male", "Female", "Non-binary", "Prefer not to say"], {
    message: "Please select a gender.",
  }),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed", "Other"], {
    message: "Please select marital status.",
  }),
  therapistGenderPreference: z.string().optional(),
  therapistSpecializationPreference: z.string().optional(),
})

type PatientBiodataFormValues = z.infer<typeof formSchema>

interface BookingStep1Props {
  onNext: (data: PatientBiodataFormValues) => void
  initialData?: PatientBiodataFormValues
  userData?: {
    full_name?: string
    email?: string
  }
}

export default function BookingStep1({ onNext, initialData, userData }: BookingStep1Props) {
  const form = useForm<PatientBiodataFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      firstName: userData?.full_name || "",
      email: userData?.email || "",
      phone: "",
      country: "",
      complaints: "",
      age: "",
      gender: "Male",
      maritalStatus: "Single",
      therapistGenderPreference: "no-preference",
      therapistSpecializationPreference: "no-preference",
    },
  })

  // Update form values when userData changes
  useEffect(() => {
    if (userData?.full_name || userData?.email) {
      form.setValue('firstName', userData.full_name || '')
      form.setValue('email', userData.email || '')
    }
  }, [userData, form])

  function onSubmit(data: PatientBiodataFormValues) {
    onNext(data)
  }

  // Predefined list of therapy specializations
  const specializations = [
    "Anxiety & Stress Management",
    "Depression & Mood Disorders", 
    "Relationship & Family Therapy",
    "Trauma & PTSD",
    "Addiction & Recovery"
  ]

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Patient Information</h3>
        
        {/* Contact Information Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
          {userData?.full_name && userData?.email && (
            <p className="text-sm text-gray-600">
              Your name and email are pre-filled from your account and cannot be changed here.
            </p>
          )}
          {(!userData?.full_name || !userData?.email) && (
            <p className="text-sm text-gray-600">
              Please provide your contact information to continue with booking.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      {...field} 
                      disabled={!!(userData?.full_name)}
                      className={userData?.full_name ? "bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed" : ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      {...field} 
                      disabled={!!(userData?.email)}
                      className={userData?.email ? "bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed" : ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+234 801 234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg max-h-60">
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="complaints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complaints/Enquiry</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe what brings you to therapy..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Therapist Preferences Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Therapist Preferences (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="therapistGenderPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="no-preference">No Preference</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="therapistSpecializationPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Specialization</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="no-preference">No Preference</SelectItem>
                      {specializations.map((specialization) => (
                        <SelectItem key={specialization} value={specialization}>
                          {specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full">
          Next: Select Therapist
        </Button>
      </form>
    </Form>
  )
}
