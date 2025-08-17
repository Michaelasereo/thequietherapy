"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Shield, Users, Settings, BarChart3, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
})

type LoginFormValues = z.infer<typeof formSchema>

export default function AdminLoginPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, userType: 'admin' }),
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

      {/* Left Section - Black Background with Admin Features */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Admin Dashboard Demo */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Platform Stats Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Platform Overview</span>
                      <Shield className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Total Users: 2,847</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Active Sessions: 156</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-300" />
                        <span className="text-sm">Pending Approvals: 12</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">System Health</span>
                      <span className="text-xs opacity-75">All Systems Operational</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                        <span className="text-sm">Database: Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                        <span className="text-sm">Email Service: Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                        <span className="text-sm">Payment Gateway: Connected</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            <p>Administrative access to Trpi platform management</p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Login</h1>
            </div>
            <p className="text-muted-foreground">
              Access the Trpi platform administration dashboard
            </p>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your admin email"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Sending Magic Link..."
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Need admin access? Contact the platform administrator
            </p>
            
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Individual Login
              </Link>
              <Link href="/therapist/login" className="text-muted-foreground hover:text-foreground">
                Therapist Login
              </Link>
              <Link href="/partner/auth" className="text-muted-foreground hover:text-foreground">
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
