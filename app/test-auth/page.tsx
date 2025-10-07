"use client"

import { useSession } from '@/lib/client-session-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, User, Mail, Shield } from 'lucide-react'

export default function TestAuthPage() {
  const { session, loading, error, logout } = useSession()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Test</h1>
          <p className="text-gray-600">Test the magic link authentication system</p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {session ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    User is authenticated successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium">Name:</span>
                    <span className="ml-2">{session.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{session.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium">Role:</span>
                    <span className="ml-2 capitalize">{session.role}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">User Type:</span>
                    <span className="ml-2">{session.user_type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Verified:</span>
                    <span className="ml-2">{session.is_verified ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <Button onClick={logout} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    User is not authenticated
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <a href="/login">Go to Login</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/register">Go to Register</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/therapist/login">Therapist Login</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/partner/login">Partner Login</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/admin/login">Admin Login</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Magic Link Test */}
        <Card>
          <CardHeader>
            <CardTitle>Magic Link Test</CardTitle>
            <CardDescription>
              Test sending magic links for different user types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <a href="/login?user_type=individual">Test Individual Magic Link</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login?user_type=therapist">Test Therapist Magic Link</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login?user_type=partner">Test Partner Magic Link</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login?user_type=admin">Test Admin Magic Link</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
