"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get('user_type') as 'individual' | 'therapist' | 'partner' | 'admin' || 'individual'

  useEffect(() => {
    // Redirect to login page with user type parameter for magic link signup
    const loginUrl = `/login?user_type=${userType}&mode=signup`
    router.push(loginUrl)
  }, [router, userType])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Logo className="mx-auto h-12 w-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Redirecting to Sign Up...
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you to the secure sign-up page.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-black hover:text-gray-800 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A66B24] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}