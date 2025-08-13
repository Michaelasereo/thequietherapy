'use client';

import type React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import PartnerDashboardSidebar from "@/components/partner-dashboard-sidebar"
import { PartnerDashboardProvider } from '@/context/partner-dashboard-context';
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { DebugToggle } from '@/components/ui/debug-panel';



function PartnerDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state
  useCrossDashboardSync('partner');
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <PartnerDashboardSidebar />
        <SidebarInset className="w-full">
          <main className="flex-1 overflow-y-auto !bg-white w-full">
            <div className="p-6 w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <DebugToggle dashboardType="partner" />
    </SidebarProvider>
  );
}

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <PartnerDashboardProvider>
        <PartnerDashboardLayoutContent>
          {children}
        </PartnerDashboardLayoutContent>
      </PartnerDashboardProvider>
    </GlobalStateProvider>
  );
}


