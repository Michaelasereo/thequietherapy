"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to proceed.",
  }),
})

type TermsConditionsFormValues = z.infer<typeof formSchema>

interface Step4TermsConditionsProps {
  onBack: () => void
  onSubmit: (data: TermsConditionsFormValues) => void
  isSubmitting: boolean
  canEnroll?: boolean
}

export default function Step4TermsConditions({ onBack, onSubmit, isSubmitting, canEnroll = true }: Step4TermsConditionsProps) {
  const form = useForm<TermsConditionsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termsAccepted: false,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Step 4: Terms & Conditions</h3>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please review our terms and conditions carefully. By accepting, you agree to abide by our platform's
            guidelines, privacy policy, and professional conduct standards.
          </p>
          <Textarea
            readOnly
            value={`
            1. Service Agreement: By enrolling as a therapist on Trpi, you agree to provide professional therapy services in accordance with your qualifications and ethical guidelines.
            2. Confidentiality: You commit to maintaining strict client confidentiality as per professional standards and legal requirements.
            3. Payment Terms: Details regarding session fees, payment processing, and payout schedules are outlined in our financial policy.
            4. Platform Usage: You agree to use the Trpi platform responsibly and not engage in any activity that violates our terms of service.
            5. License & Verification: You confirm that all provided professional licenses and documents are valid and up-to-date.
            6. Termination: Trpi reserves the right to terminate this agreement under specific conditions outlined in the full terms.
            `}
            className="min-h-[200px] resize-none bg-muted/50"
          />
        </div>

        <FormField
          control={form.control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I agree to the Terms & Conditions</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting || !canEnroll}>
            {isSubmitting ? "Submitting..." : "Submit Enrollment"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
