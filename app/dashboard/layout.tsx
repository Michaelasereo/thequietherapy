'use client';

import React, { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardProvider } from "@/context/dashboard-context"
import { GlobalStateProvider } from '@/context/global-state-context';
import { ClientSessionManager } from '@/lib/client-session-manager';
import { useRouter } from 'next/navigation'
import DashboardHeader from "@/components/dashboard-header"
import { OnboardingWrapper } from "@/components/onboarding-wrapper"
import { DevSessionSetup } from "@/components/dev-session-setup"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
            const sessionData = ClientSessionManager.getSession();
        if (!sessionData) {
          console.log('🔍 DashboardLayout: No session found, redirecting to login')
          router.push('/login')
        } else {
          console.log('🔍 DashboardLayout: Valid session found for user:', sessionData.email)
          setSession(sessionData);
        }
      } catch (error) {
        console.error('🔍 DashboardLayout: Auth check error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null
  }

  const userInfo = { 
    name: session.name || session.email?.split('@')[0] || 'User', 
    email: session.email || '' 
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
      
      {/* Development Tools - Only visible in development */}
      <DevSessionSetup />
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
