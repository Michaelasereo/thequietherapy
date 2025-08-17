"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number is required." }),
})

type BasicDetailsFormValues = z.infer<typeof formSchema>

interface Step1BasicDetailsProps {
  onNext: (data: BasicDetailsFormValues) => void
  initialData?: BasicDetailsFormValues
  onEmailStatusChange?: (status: { canEnroll: boolean; message: string; redirectTo: string }) => void
}

export default function Step1BasicDetails({ onNext, initialData, onEmailStatusChange }: Step1BasicDetailsProps) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [canEnroll, setCanEnroll] = useState(true)
  const [redirectTo, setRedirectTo] = useState('')

  const form = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      fullName: "",
      email: "",
      phone: "",
    },
  })

  // Check email when it changes
  const email = form.watch('email')
  
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setEmailStatus('idle')
        setEmailMessage('')
        setCanEnroll(true)
        return
      }

      setEmailStatus('checking')
      
      try {
        const response = await fetch('/api/check-email-exists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email.trim(),
            userType: 'therapist' // Specify we're checking for therapist enrollment
          }),
        })

        const data = await response.json()

        if (data.exists) {
          setEmailStatus('exists')
          setEmailMessage(data.message)
          setCanEnroll(data.canEnroll)
          setRedirectTo(data.redirectTo)
        } else {
          setEmailStatus('available')
          setEmailMessage('Email is available for therapist enrollment')
          setCanEnroll(true)
          setRedirectTo('')
        }
        
        // Notify parent component of email status change
        if (onEmailStatusChange) {
          onEmailStatusChange({
            canEnroll: data.canEnroll,
            message: data.message,
            redirectTo: data.redirectTo
          })
        }
      } catch (error) {
        console.error('Error checking email:', error)
        setEmailStatus('idle')
        setEmailMessage('')
        setCanEnroll(true)
      }
    }

    // Debounce the email check
    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [email, onEmailStatusChange])

  function onSubmit(data: BasicDetailsFormValues) {
    if (!canEnroll) {
      return
    }
    onNext(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        <h3 className="text-xl font-semibold mb-4">Step 1: Basic Details</h3>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Jane Doe" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
              
              {/* Email status display */}
              {emailStatus === 'checking' && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Checking email availability...
                </div>
              )}
              
              {emailStatus === 'exists' && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {emailMessage}
                    {redirectTo && (
                      <div className="mt-2">
                        <Link href={redirectTo}>
                          <Button variant="outline" size="sm" className="w-full">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Go to Login
                          </Button>
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {emailStatus === 'available' && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Email is available for therapist enrollment
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!canEnroll || emailStatus === 'checking'}
        >
          {emailStatus === 'checking' ? 'Checking...' : 'Next'}
        </Button>
      </form>
    </Form>
  )
}
