import type React from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import TherapistDashboardSidebar from "@/components/therapist-dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TherapistUserProvider } from "@/context/therapist-user-context"
import { TherapistDashboardProvider } from "@/context/therapist-dashboard-context"
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';
import { DebugToggle } from "@/components/ui/debug-panel"
import { cookies } from 'next/headers'

async function TherapistDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  console.log('🔍 TherapistDashboardLayout: Rendering layout content')
  
  // Use unified SessionManager to get session
  const { SessionManager } = await import('@/lib/session-manager')
  const session = await SessionManager.getSession()
  
  if (!session || session.role !== 'therapist') {
    console.log('❌ No therapist session found, redirecting to login')
    redirect('/therapist/login')
  }

  console.log('✅ Therapist session found:', session.email)
  
  const user = { 
    id: session.id,
    name: session.name, 
    email: session.email,
    user_type: session.role
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <TherapistDashboardSidebar />
        <SidebarInset className="w-full">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger />
            </div>
            <Separator orientation="vertical" className="mr-auto h-4" />
            <div className="flex items-center gap-2 px-4">
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
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>TH</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto !bg-white w-full">
            <div className="p-6 w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <DebugToggle dashboardType="therapist" />
    </SidebarProvider>
  );
}

export default function TherapistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <TherapistUserProvider>
        <TherapistDashboardProvider>
          <TherapistDashboardLayoutContent>
            {children}
          </TherapistDashboardLayoutContent>
        </TherapistDashboardProvider>
      </TherapistUserProvider>
    </GlobalStateProvider>
  );
}
