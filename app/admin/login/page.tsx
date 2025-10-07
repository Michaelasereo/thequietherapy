"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Shield, CheckCircle, Users, Clock, Heart, DollarSign, Award } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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
          user_type: 'admin',
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            user_type: 'admin',
            redirect_url: '/admin/dashboard'
          }
        }
      })

      if (error) {
        setError(error.message)
        console.error('Google OAuth error:', error)
      } else {
        console.log('Google OAuth initiated:', data)
      }
    } catch (error) {
      console.error('Google OAuth exception:', error)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Black Background with Admin Benefits */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          {/* Admin Benefits */}
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-sm">
              {/* Admin Tools Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Admin Tools</span>
                      <Shield className="h-4 w-4 text-red-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">User management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">System monitoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm">Analytics dashboard</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Security Features</span>
                      <Award className="h-4 w-4 text-red-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-red-300" />
                        <span className="text-xs">Access control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-red-300" />
                        <span className="text-xs">User permissions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-red-300" />
                        <span className="text-xs">Activity logs</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Admin Portal</h2>
            <p className="text-gray-300 leading-relaxed">
              Access comprehensive administrative tools to manage the platform, 
              monitor system health, and oversee user activities with full control.
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">User Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">System Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Admin Login Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Sign In</h1>
            <p className="text-gray-600">Access the admin dashboard</p>
            <p className="text-sm text-red-600 mt-1">Administrative Access</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign in to your admin account</CardTitle>
              <CardDescription>
                Choose your preferred sign-in method
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
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
                  Need admin access?{' '}
                  <Link 
                    href="/contact" 
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Contact system administrator
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