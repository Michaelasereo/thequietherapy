"use client"

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, UserPlus, CheckCircle, Shield, Users, Clock, Heart } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userType = searchParams.get('user_type') as 'individual' | 'therapist' | 'partner' | 'admin' || 'individual'
  
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          user_type: userType,
          type: 'signup',
          metadata: {
            first_name: firstName.trim()
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Account created! Please check your email and click the verification link to complete registration.')
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'therapist': return 'Therapist'
      case 'partner': return 'Partner'
      case 'admin': return 'Admin'
      default: return 'User'
    }
  }

  const getRedirectUrl = () => {
    switch (userType) {
      case 'therapist': return '/therapist/dashboard'
      case 'partner': return '/partner/dashboard'
      case 'admin': return '/admin/dashboard'
      default: return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Black Background with Platform Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Platform Benefits */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Getting Started Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Start Your Journey</span>
                      <UserPlus className="h-4 w-4 text-green-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Free account creation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Instant therapist matching</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Personalized recommendations</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Therapy Options Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Therapy Options</span>
                      <Heart className="h-4 w-4 text-pink-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-pink-300" />
                        <span className="text-xs">Individual therapy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-pink-300" />
                        <span className="text-xs">Couples counseling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-pink-300" />
                        <span className="text-xs">Group sessions</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Story Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Heart className="h-4 w-4 text-pink-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Michael K.</div>
                        <div className="text-xs opacity-75">New member</div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75">
                      "Joining Quiet was the best decision I made. The sign-up process was simple and I found my perfect therapist in just one day."
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-gray-300 leading-relaxed">
              Take the first step towards better mental health. Join thousands of people who have found 
              support, healing, and growth through our platform. Your journey to wellness starts here.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Expert Care</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Available 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Registration Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join our therapy platform</p>
            {userType !== 'individual' && (
              <p className="text-sm text-blue-600 mt-1">{getUserTypeLabel()} Registration</p>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign up with Magic Link</CardTitle>
              <CardDescription>
                Enter your details and we'll send you a secure verification link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email.trim() || !firstName.trim()}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link 
                    href={`/login?user_type=${userType}`} 
                    className="text-black hover:text-gray-800 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <Link 
                  href="/" 
                  className="text-sm text-gray-500 hover:text-gray-800 flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}