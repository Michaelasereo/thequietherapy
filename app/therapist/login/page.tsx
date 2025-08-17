"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Shield, Users, Clock, CheckCircle, ArrowLeft, Calendar, DollarSign, Star, AlertCircle } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
})

type LoginFormValues = z.infer<typeof formSchema>

export default function TherapistLoginPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'not-found'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [canLogin, setCanLogin] = useState(true)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  // Check email when it changes
  const email = form.watch('email')
  
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setEmailStatus('idle')
        setEmailMessage('')
        setCanLogin(true)
        return
      }

      setEmailStatus('checking')
      
      try {
        const response = await fetch('/api/check-email-exists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        })

        const data = await response.json()

        if (data.exists) {
          if (data.userType === 'therapist') {
            setEmailStatus('exists')
            setEmailMessage('Email found! You can proceed with login.')
            setCanLogin(true)
          } else {
            setEmailStatus('not-found')
            setEmailMessage('This email is registered as a different user type.')
            setCanLogin(false)
          }
        } else {
          setEmailStatus('not-found')
          setEmailMessage('Email not found. Please enroll first before logging in.')
          setCanLogin(false)
        }
      } catch (error) {
        console.error('Error checking email:', error)
        setEmailStatus('idle')
        setEmailMessage('')
        setCanLogin(true)
      }
    }

    // Debounce the email check
    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [email])

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, userType: 'therapist' }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast({
          title: "Magic Link Sent!",
          description: "Please check your email for the login link.",
        })
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Back Button */}
      <div className="absolute top-6 right-6 z-20">
        <Button asChild variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Left Section - Black Background with Therapist Features */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Therapist Dashboard Demo */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Today's Sessions Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Today's Sessions</span>
                      <span className="text-xs opacity-75">4 scheduled</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-300" />
                        <span className="text-sm">9:00 AM - Anxiety Support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-300" />
                        <span className="text-sm">11:00 AM - Stress Management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-300" />
                        <span className="text-sm">2:00 PM - Depression Therapy</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">This Week's Earnings</span>
                      <DollarSign className="h-4 w-4 text-green-300" />
                    </div>
                    <div className="text-2xl font-bold text-green-300 mb-1">₦45,000</div>
                    <div className="flex justify-between text-xs opacity-75">
                      <span>Sessions: 12</span>
                      <span>+15% from last week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Reviews Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-yellow-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Client Satisfaction</div>
                        <div className="text-xs opacity-75">4.9/5.0 rating</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <Users className="h-3 w-3" />
                      <span>28 active clients</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Welcome Back, Therapist</h2>
            <p className="text-gray-300 leading-relaxed">
              Access your professional dashboard, manage your sessions, and provide exceptional care to your clients. 
              Your expertise makes a difference in people's lives every day.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Client Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Flexible Schedule</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Therapist Login</h1>
            <p className="text-gray-600">Access your professional dashboard</p>
          </div>

          {/* Social Login Buttons */}
          <div className="mb-6">
            <Button variant="outline" className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        className="h-12 bg-white border-gray-300 focus:border-black focus:ring-black"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    
                    {/* Email status display */}
                    {emailStatus === 'checking' && (
                      <div className="text-sm text-blue-600 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Checking email...
                      </div>
                    )}
                    
                    {emailStatus === 'exists' && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {emailMessage}
                      </div>
                    )}
                    
                    {emailStatus === 'not-found' && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {emailMessage}
                          <div className="mt-2">
                            <Link href="/therapist/enroll">
                              <Button variant="outline" size="sm" className="w-full">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Enroll Now
                              </Button>
                            </Link>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800 text-white"
                disabled={isLoading || !canLogin || emailStatus === 'checking'}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <span className="text-gray-600">New to Trpi? </span>
            <Link href="/therapist/enroll" className="text-[#A66B24] hover:text-[#8B5A1F] font-medium">
              Enroll as Therapist
            </Link>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <span>© 2024 Quiet. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
