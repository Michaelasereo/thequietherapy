'use client';

import type React from "react"
import { Suspense } from "react"
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
import { DebugToggle } from '@/components/ui/debug-panel';

function AdminDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state
  useCrossDashboardSync('admin');
  
  return (
    <>
      <div className="flex h-screen bg-white">
        <AdminDashboardSidebar />
        <main className="flex-1 overflow-y-auto !bg-white">
          <div className="p-6">
          {children}
        </div>
      </main>
      </div>
      <DebugToggle dashboardType="admin" />
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
      <AdminDashboardProvider>
        <AdminDashboardLayoutContent>
          {children}
        </AdminDashboardLayoutContent>
      </AdminDashboardProvider>
    </GlobalStateProvider>
  );
}
