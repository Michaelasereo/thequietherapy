'use client';

import type React from "react"
import { Suspense, useEffect } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import AdminDashboardSidebar from "@/components/admin-dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AdminDashboardProvider } from '@/context/admin-dashboard-context';
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { AdminProvider, useAdmin } from '@/context/admin-context';
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useRouter } from 'next/navigation'

function AdminDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state
  useCrossDashboardSync('admin');
  
  // Get admin authentication data
  const { adminUser, loading, isAuthenticated } = useAdmin();
  const router = useRouter();
  
  // Handle redirect in useEffect to avoid React errors
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('🔍 AdminDashboardLayout: User not authenticated, redirecting to login')
      router.push('/admin/login')
    }
  }, [loading, isAuthenticated, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen bg-white">
          <AdminDashboardSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-6">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Admin Dashboard</span>
              </div>
              <Separator orientation="vertical" className="mr-auto h-4" />
              <div className="flex items-center gap-2">
                <form className="ml-auto flex-1 sm:flex-initial">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="pl-8 sm:w-[300px]"
                    />
                  </div>
                </form>
                <NotificationBell userId={adminUser?.id || ""} userType="admin" />
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>{adminUser?.name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 w-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <AdminProvider>
        <AdminDashboardProvider>
          <AdminDashboardLayoutContent>
            {children}
          </AdminDashboardLayoutContent>
        </AdminDashboardProvider>
      </AdminProvider>
    </GlobalStateProvider>
  );
}
