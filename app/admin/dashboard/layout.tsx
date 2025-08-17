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

import { NotificationBell } from '@/components/notifications/notification-bell'

function AdminDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state
  useCrossDashboardSync('admin');
  
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
                <NotificationBell userId="fac0056c-2f16-4417-a1ae-9c63345937c8" userType="admin" />
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>A</AvatarFallback>
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
      <AdminDashboardProvider>
        <AdminDashboardLayoutContent>
          {children}
        </AdminDashboardLayoutContent>
      </AdminDashboardProvider>
    </GlobalStateProvider>
  );
}
