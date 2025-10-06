'use client';

import type React from "react"
import { Suspense, useEffect } from "react"
import AdminDashboardSidebar from "@/components/admin-dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Search, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AdminDashboardProvider } from '@/context/admin-dashboard-context';
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { AdminProvider, useAdmin } from '@/context/admin-context';
import { useRouter } from 'next/navigation'

function AdminDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state - disabled real-time updates to prevent reloading
  const crossDashboardSync = useCrossDashboardSync('admin');
  
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
  
  const adminInfo = { 
    name: adminUser?.name || adminUser?.email?.split('@')[0] || 'Admin', 
    email: adminUser?.email || 'admin@trpi.com' 
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminDashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
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
