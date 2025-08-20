"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your magic link...')

  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams.get('token')
      const userType = searchParams.get('userType') || 'individual'

      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. Missing token.')
        return
      }

      try {
        console.log('🔍 Verifying magic link for user type:', userType)
        
        // Call the appropriate verification endpoint based on user type
        let verifyEndpoint = '/api/auth/verify-magic-link'
        if (userType === 'therapist') {
          verifyEndpoint = '/api/therapist/verify-magic-link'
        } else if (userType === 'partner') {
          verifyEndpoint = '/api/partner/verify-magic-link'
        } else if (userType === 'admin') {
          verifyEndpoint = '/api/admin/verify-magic-link'
        }

        const response = await fetch(verifyEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, userType }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Verification successful! Redirecting to your dashboard...')
          
          // Redirect to appropriate dashboard immediately
          if (userType === 'therapist') {
            router.push('/therapist/dashboard')
          } else if (userType === 'partner') {
            router.push('/partner/dashboard')
          } else if (userType === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. Please try again.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyMagicLink()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your magic link'}
            {status === 'success' && 'Your account has been verified successfully'}
            {status === 'error' && 'There was an issue with your verification'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-8 w-8 text-red-600" />
              <p className="text-sm text-gray-600">{message}</p>
              <Button 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading verification...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
