'use client';

import React, { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardProvider } from "@/context/dashboard-context"
import { GlobalStateProvider } from '@/context/global-state-context';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation'
import DashboardHeader from "@/components/dashboard-header"
import { OnboardingWrapper } from "@/components/onboarding-wrapper"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated (only on client after mount)
  // Add extra delay for magic link redirects to allow cookie to be processed
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      // Check if we just came from a magic link redirect
      const urlParams = new URLSearchParams(window.location.search)
      const mightBeMagicLinkRedirect = urlParams.has('token') || urlParams.has('auth_type')
      
      if (mightBeMagicLinkRedirect) {
        // Wait a bit longer before redirecting - cookie might still be processing
        console.log('🔍 DashboardLayout: Magic link redirect detected, waiting for session...')
        const timeoutId = setTimeout(() => {
          if (!isAuthenticated) {
            console.log('🔍 DashboardLayout: No session found after magic link, redirecting to login')
            router.push('/login')
          }
        }, 2000) // Give 2 seconds for cookie to be available
        
        return () => clearTimeout(timeoutId)
      } else {
        console.log('🔍 DashboardLayout: No session found, redirecting to login')
        router.push('/login')
      }
    }
  }, [mounted, loading, isAuthenticated, router])

  // Show loading state while checking authentication
  // Add timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ DashboardLayout: Loading timeout (8s), showing error state')
        setLoadingTimeout(true)
      }, 8000)
      
      return () => clearTimeout(timeout)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          {loadingTimeout && (
            <div className="mt-4">
              <p className="text-sm text-red-600 mb-2">Loading is taking longer than expected</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="text-sm text-blue-600 hover:underline"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Extract only the needed fields to avoid passing the entire session object
  const userInfo = { 
    name: user.full_name || user.email?.split('@')[0] || 'User',
    full_name: user.full_name || '',
    email: user.email || '' 
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <DashboardSidebar />
        <SidebarInset>
          {/* Top Header Bar - Demarcation */}
          <DashboardHeader user={userInfo} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      
      {/* Onboarding Modal - Shows for new users */}
      <OnboardingWrapper user={userInfo} />
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalStateProvider>
      <DashboardProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </DashboardProvider>
    </GlobalStateProvider>
  )
}
