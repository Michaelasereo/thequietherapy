'use client';

import type React from "react"
import { TherapistUserProvider } from "@/context/therapist-user-context"
import { useTherapistUser } from "@/context/therapist-user-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

function TherapistAuthCheck({ children }: { children: React.ReactNode }) {
  const { therapistUser, loading, isAuthenticated } = useTherapistUser()
  const router = useRouter()
  const pathname = usePathname()

  // Don't check authentication for login and enroll pages
  const isAuthPage = pathname === '/therapist/login' || pathname === '/therapist/enroll'

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.push('/therapist/login')
    }
  }, [loading, isAuthenticated, router, isAuthPage])

  // If it's an auth page, render children without authentication check
  if (isAuthPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default function TherapistRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TherapistUserProvider>
      <TherapistAuthCheck>
        {children}
      </TherapistAuthCheck>
    </TherapistUserProvider>
  )
}
