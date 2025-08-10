"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Brain, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
  const router = useRouter()
  const [isCreateAccount, setIsCreateAccount] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isCreateAccount && formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    
    try {
      if (isCreateAccount) {
        // Create account
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Registration successful:", data)
          setIsVerificationModalOpen(true)
        } else {
          alert(data.error || 'Registration failed. Please try again.')
        }
      } else {
        // Login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Login successful:", data)
          router.push("/dashboard")
        } else {
          alert(data.error || 'Login failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('Authentication failed. Please try again.')
    }
  }

  const handleVerificationComplete = () => {
    setIsVerificationModalOpen(false)
    // Don't redirect - let user check their email first
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-2">
              <Brain className="h-7 w-7 text-primary" />
              Trpi
            </Link>
            <CardTitle className="text-2xl">
              {isCreateAccount ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isCreateAccount ? "Sign up to start your therapy journey" : "Sign in to your account"}
            </CardDescription>
            
            {/* Mode toggle */}
            <div className="flex justify-center mt-4">
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccount(false)
                    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" })
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isCreateAccount
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccount(true)
                    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" })
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCreateAccount
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCreateAccount && (
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required={isCreateAccount}
                  />
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {isCreateAccount && (
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required={isCreateAccount}
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                {isCreateAccount ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Email Verification Modal */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="sm:max-w-[425px] text-center p-6">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Check Your Email</DialogTitle>
            <DialogDescription className="text-md">
              We've sent a verification link to <strong>{formData.email}</strong>. 
              <br /><br />
              Click the link in your email to verify your account and sign in to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Verification email sent successfully</span>
            </div>
            <Button onClick={handleVerificationComplete} className="w-full">
              Got it, I'll check my email
            </Button>
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or{" "}
              <button className="underline">resend verification</button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
