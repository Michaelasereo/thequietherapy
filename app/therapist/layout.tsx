'use client';

import React, { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import TherapistDashboardSidebar from "@/components/therapist-dashboard-sidebar"
import TherapistHeader from "@/components/therapist-header"
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useTherapistUser } from '@/context/therapist-user-context'
import { TherapistUserProvider } from "@/context/therapist-user-context"
import { TherapistDashboardProvider } from "@/context/therapist-dashboard-context"

function TherapistLayoutContent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { user, loading } = useAuth();
  const { therapist, loading: therapistLoading } = useTherapistUser();
  const router = useRouter();
  const pathname = usePathname();

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication on mount - client-side only
  useEffect(() => {
    // Check if this is a public page first
    const isPublicPage = pathname === '/therapist/login' || 
                        pathname.startsWith('/therapist/login') || 
                        pathname === '/therapist/enroll' || 
                        pathname.startsWith('/therapist/enroll');
    
    // Skip auth check for public pages
    if (isPublicPage) {
      console.log('🔍 TherapistLayout: Public page detected, skipping auth check')
      setIsAuthenticated(true); // Set to true to allow rendering
      return;
    }
    
    if (mounted && !loading && !therapistLoading) {
      if (!user) {
        console.log('🔍 TherapistLayout: No user found, redirecting to login')
        setIsAuthenticated(false);
        router.replace('/therapist/login')
      } else {
        console.log('🔍 TherapistLayout: Valid user found:', user.email)
        setIsAuthenticated(true);
      }
    }
  }, [user, loading, therapistLoading, router, mounted, pathname])

  // Check if this is the login page or enroll page FIRST - if so, don't apply dashboard layout
  const isPublicPage = pathname === '/therapist/login' || 
                       pathname.startsWith('/therapist/login') || 
                       pathname === '/therapist/enroll' || 
                       pathname.startsWith('/therapist/enroll');
  
  console.log('🔍 TherapistLayout: Current pathname:', pathname);
  console.log('🔍 TherapistLayout: Is public page:', isPublicPage);
  
  if (isPublicPage) {
    console.log('🔍 TherapistLayout: Rendering public page without dashboard layout');
    return <>{children}</>;
  }

  // Show loading on server and initial client render to prevent hydration mismatch
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication and loading therapist data
  if (loading || therapistLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated - already handled redirect above
  if (isAuthenticated === false) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If we have therapist data, use it; otherwise use user data
  const displayName = therapist?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Therapist'

  // Extract only the needed fields to avoid passing the entire user object
  // Prioritize therapist data which includes enrollment profile image
  // Fallback to user.avatar_url if therapist data isn't loaded yet
  const userInfo = { 
    name: displayName,
    full_name: therapist?.full_name || user?.full_name || '',
    email: therapist?.email || user?.email || '',
    profile_image_url: therapist?.profile_image_url || (user as any)?.avatar_url || undefined // ✅ STANDARDIZED - fallback to user.avatar_url
  }
  
  console.log('🔍 TherapistLayout: userInfo profile_image_url:', userInfo.profile_image_url)
  console.log('🔍 TherapistLayout: therapist profile_image_url:', therapist?.profile_image_url)
  console.log('🔍 TherapistLayout: user data available:', !!user)

  // Debug logging (can be removed in production)
  console.log('🔍 TherapistLayout: userInfo being passed to header:', userInfo);
  console.log('🔍 TherapistLayout: displayName resolved to:', displayName);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <TherapistDashboardSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Top Header Bar */}
          <TherapistHeader user={userInfo} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-white">
            <div className="w-full p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default function TherapistRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TherapistUserProvider>
      <TherapistDashboardProvider>
        <TherapistLayoutContent>
          {children}
        </TherapistLayoutContent>
      </TherapistDashboardProvider>
    </TherapistUserProvider>
  )
}
