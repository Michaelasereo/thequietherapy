"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Building, CheckCircle, Shield, Users, Clock, Heart, DollarSign, Award } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { supabase } from '@/lib/supabase'
import WarmMagicLinkNotification from '@/components/warm-magic-link-notification'

export default function PartnerLoginPage() {
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
          user_type: 'partner',
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
      {/* Left Section - Black Background with Partner Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Partner Benefits */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Partnership Benefits Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Partnership Benefits</span>
                      <Building className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Bulk user management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Analytics dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Tools Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Management Tools</span>
                      <Award className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">User enrollment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">Secure access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs">Usage tracking</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Partner Portal</h2>
            <p className="text-gray-300 leading-relaxed">
              Manage your organization's mental health program with our comprehensive partner tools. 
              Track usage, enroll users, and access detailed analytics.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Organization</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">User Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Partner Login Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Sign In</h1>
            <p className="text-gray-600">Access your partner dashboard</p>
            <p className="text-sm text-blue-600 mt-1">Organization Login</p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="partner@organization.com"
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
                  <WarmMagicLinkNotification message={message} />
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
                  Not a partner yet?{' '}
                  <Link 
                    href="/partner/enroll" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Apply to become a partner
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