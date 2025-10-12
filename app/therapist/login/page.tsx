"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Stethoscope, CheckCircle, Shield, Users, Clock, Heart, DollarSign, Award } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { supabase } from '@/lib/supabase'

export default function TherapistLoginPage() {
  const [email, setEmail] = useState('')
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
          user_type: 'therapist',
          type: 'login'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Magic link sent! Please check your email and click the link to sign in.')
      } else {
        // Check if there's a redirect URL in the response
        if (data.redirectTo) {
          // Redirect to signup page with error message
          window.location.href = data.redirectTo
          return
        }
        setError(data.error || 'Failed to send magic link')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex">
      {/* Left Section - Black Background with Therapist Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Therapist Benefits */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Earnings Potential Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Your Earnings</span>
                      <DollarSign className="h-4 w-4 text-green-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">₦3,000 - ₦5,000 per session</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Weekly payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Flexible scheduling</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Benefits Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Platform Tools</span>
                      <Award className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">Secure video calls</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">Client management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">Session scheduling</span>
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
                        <Stethoscope className="h-4 w-4 text-blue-300" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Dr. Sarah Johnson</div>
                        <div className="text-xs opacity-75">4.9★ rating</div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75">
                      "Quiet has transformed my practice. I can help more people while maintaining work-life balance."
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Welcome Back, Doctor</h2>
            <p className="text-gray-300 leading-relaxed">
              Access your therapist dashboard and continue making a difference in people's lives. 
              Manage your clients, schedule sessions, and grow your practice with our comprehensive tools.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Client Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Flexible Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Therapist Login Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Therapist Sign In</h1>
            <p className="text-gray-600">Access your therapist dashboard</p>
            <p className="text-sm text-blue-600 mt-1">Professional Login</p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="therapist@example.com"
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
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Not a therapist yet?{' '}
                  <Link 
                    href="/therapist/enroll" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Apply to join our network
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