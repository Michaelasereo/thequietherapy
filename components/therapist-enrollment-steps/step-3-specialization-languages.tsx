"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

const specializations = [
  "Cognitive Behavioral Therapy (CBT)",
  "Trauma-Informed Therapy",
  "Relationship Counseling",
  "Adolescent Therapy",
  "Anxiety & Stress Management",
  "Depression",
  "Grief Counseling",
  "Substance Abuse",
] as const

const languages = ["English", "Spanish", "French", "German", "Yoruba", "Igbo", "Hausa"] as const

const formSchema = z.object({
  specialization: z.array(z.enum(specializations)).min(1, { message: "Please select at least one specialization." }),
  languages: z.array(z.enum(languages)).min(1, { message: "Please select at least one language." }),
})

type SpecializationLanguagesFormValues = z.infer<typeof formSchema>

interface Step3SpecializationLanguagesProps {
  onNext: (data: SpecializationLanguagesFormValues) => void
  onBack: () => void
  initialData?: SpecializationLanguagesFormValues
}

export default function Step3SpecializationLanguages({
  onNext,
  onBack,
  initialData,
}: Step3SpecializationLanguagesProps) {
  const form = useForm<SpecializationLanguagesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      specialization: [],
      languages: [],
    },
  })

  function onSubmit(data: SpecializationLanguagesFormValues) {
    onNext(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Step 3: Specialization & Languages</h3>

        <FormField
          control={form.control}
          name="specialization"
          render={() => (
            <FormItem>
              <FormLabel className="text-base">Areas of Expertise</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {specializations.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="specialization"
                    render={({ field }) => {
                      return (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item) || false}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || []
                                return checked
                                  ? field.onChange([...currentValue, item])
                                  : field.onChange(currentValue.filter((value) => value !== item))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="languages"
          render={() => (
            <FormItem>
              <FormLabel className="text-base">Languages Spoken</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {languages.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="languages"
                    render={({ field }) => {
                      return (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item) || false}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || []
                                return checked
                                  ? field.onChange([...currentValue, item])
                                  : field.onChange(currentValue.filter((value) => value !== item))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}
