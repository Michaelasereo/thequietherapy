'use client';

import React, { useEffect } from "react"
import { Suspense } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardProvider } from "@/context/dashboard-context"
import { DebugToggle } from "@/components/ui/debug-panel"
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { useAuth } from '@/context/auth-context'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useRouter } from 'next/navigation'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  console.log('🔍 DashboardLayout: Component rendered')
  
  // Connect to global state
  useCrossDashboardSync('user');
  
  // Get user data from auth context
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  console.log('🔍 DashboardLayout: Auth state - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user)
  
  // Handle redirect in useEffect to avoid React errors
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('🔍 DashboardLayout: Not authenticated, redirecting to login')
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);
  
  // Get user's first name for display
  const userName = user?.full_name ? user.full_name.split(' ')[0] : "User";
  
  // Show loading state
  if (loading) {
    console.log('🔍 DashboardLayout: Showing loading state')
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show loading while redirecting
  if (!isAuthenticated) {
    console.log('🔍 DashboardLayout: Not authenticated, showing loading while redirecting')
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  console.log('🔍 DashboardLayout: Rendering dashboard content')
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <DashboardSidebar />
        <SidebarInset className="w-full">
          {/* Top Header Bar - Demarcation */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            {/* Search Bar */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search everything..."
                  className="w-full pl-8 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="absolute right-2 top-1.5 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</span>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3">
              <NotificationBell userId={user?.id || ''} userType={user?.user_type as any || "individual"} />
              <span className="text-gray-700 text-sm font-medium">Welcome, {userName}!</span>
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <DebugToggle dashboardType="user" />
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <DashboardProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </DashboardProvider>
    </GlobalStateProvider>
  );
}
