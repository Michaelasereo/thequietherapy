"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  idUpload: z.any().refine((file) => file?.length > 0, "ID document is required."),
  mdcnCode: z.string().min(1, { message: "MDCN code is required." }),
})

type DocumentVerificationFormValues = z.infer<typeof formSchema>

interface Step2DocumentVerificationProps {
  onNext: (data: DocumentVerificationFormValues) => void
  onBack: () => void
  initialData?: DocumentVerificationFormValues
}

export default function Step2DocumentVerification({ onNext, onBack, initialData }: Step2DocumentVerificationProps) {
  const form = useForm<DocumentVerificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      idUpload: undefined,
      mdcnCode: "",
    },
  })

  async function onSubmit(data: DocumentVerificationFormValues) {
    // For now, we'll just collect the MDCN code and verify manually later
    // No API verification needed for shipping
    
    toast({
      title: "Documents Uploaded",
      description: "MDCN code recorded. We'll verify this manually. Proceeding...",
    })
    onNext(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Step 2: Document Verification</h3>
        <FormField
          control={form.control}
          name="idUpload"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Upload ID Document (e.g., License, Passport)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => onChange(event.target.files)}
                  {...fieldProps}
                />
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
                <Input placeholder="Enter your MDCN registration number" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                We'll verify this manually after submission.
              </p>
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
