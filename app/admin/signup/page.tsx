"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function AdminSignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page with admin user type for magic link signup
    const loginUrl = `/login?user_type=admin&mode=signup`
    router.push(loginUrl)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Logo className="mx-auto h-12 w-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Redirecting to Admin Sign Up...
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