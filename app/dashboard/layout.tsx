import type React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardProvider } from "@/context/dashboard-context"
import { DebugToggle } from "@/components/ui/debug-panel"
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import DashboardHeader from "@/components/dashboard-header"

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Get session and validate authentication
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  
  const user = { 
    name: session.email.split('@')[0], 
    email: session.email 
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <DashboardSidebar />
        <SidebarInset className="w-full">
          {/* Top Header Bar - Demarcation */}
          <DashboardHeader user={user} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
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
