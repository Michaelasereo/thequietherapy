"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { therapists } from "@/lib/data"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
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
}

export default function BookingStep1({ onNext, initialData }: BookingStep1Props) {
  const form = useForm<PatientBiodataFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      complaints: "",
      age: "",
      gender: "Male",
      maritalStatus: "Single",
      therapistGenderPreference: "no-preference",
      therapistSpecializationPreference: "no-preference",
    },
  })

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Patient Biodata</h3>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
