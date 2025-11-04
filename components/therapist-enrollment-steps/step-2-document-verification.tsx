"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

const formSchema = z.object({
  idUpload: z.any().refine((file) => file?.length > 0, "ID document is required."),
  licensedQualification: z.string().min(1, { message: "Licensed qualification is required." }),
})

type DocumentVerificationFormValues = z.infer<typeof formSchema>

interface Step2DocumentVerificationProps {
  onNext: (data: DocumentVerificationFormValues) => void
  onBack: () => void
  initialData?: DocumentVerificationFormValues
}

export default function Step2DocumentVerification({ onNext, onBack, initialData }: Step2DocumentVerificationProps) {
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [fileError, setFileError] = useState<string>("")
  
  const form = useForm<DocumentVerificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idUpload: initialData?.idUpload || undefined,
      licensedQualification: initialData?.licensedQualification || "",
    },
  })
  
  // Preserve uploaded file name on mount if initialData has file
  useEffect(() => {
    if (initialData?.idUpload && initialData.idUpload.length > 0) {
      setUploadedFileName(initialData.idUpload[0].name)
    }
  }, [initialData])

  // ✅ FIX: Validate file before submission
  const validateFile = (file: File): string => {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return 'File must be PDF, JPEG, PNG, or WebP'
    }
    
    return ''
  }

  async function onSubmit(data: DocumentVerificationFormValues) {
    // ✅ FIX: Validate file before proceeding
    if (data.idUpload && data.idUpload.length > 0) {
      const file = data.idUpload[0]
      const error = validateFile(file)
      
      if (error) {
        setFileError(error)
        toast({
          title: "Invalid File",
          description: error,
          variant: "destructive",
        })
        return
      }
      
      console.log('✅ Valid file selected:', file.name, file.size, 'bytes')
    }
    
    setFileError("")
    
    toast({
      title: "Documents Uploaded",
      description: "Licensed qualification recorded. We'll verify this manually. Proceeding...",
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
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    const files = event.target.files
                    onChange(files)
                    setFileError("") // Clear previous errors
                    
                    if (files && files.length > 0) {
                      const file = files[0]
                      setUploadedFileName(file.name)
                      
                      // ✅ FIX: Validate file on selection
                      const error = validateFile(file)
                      if (error) {
                        setFileError(error)
                        toast({
                          title: "Invalid File",
                          description: error,
                          variant: "destructive",
                        })
                      } else {
                        console.log('✅ Valid file selected:', file.name, file.size, 'bytes')
                      }
                    }
                  }}
                  {...fieldProps}
                />
              </FormControl>
              {uploadedFileName && !fileError && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Selected: {uploadedFileName}
                </p>
              )}
              {fileError && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ {fileError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: PDF, JPG, PNG, WebP (Max 10MB)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licensedQualification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Licensed Qualification</FormLabel>
              <FormControl>
                <Input placeholder="Enter your licensed qualification (e.g., MD, DO, PhD, Licensed Therapist)" {...field} />
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
