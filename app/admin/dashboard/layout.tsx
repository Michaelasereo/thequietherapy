import type React from "react"
import { Suspense } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import AdminDashboardSidebar from "@/components/admin-dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Mock admin data
  const admin = { name: "Admin", email: "admin@trpi.com" }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminDashboardSidebar />
      <SidebarInset>
        <Suspense fallback={<div>Loading...</div>}>
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users, therapists, partners..."
                className="w-full rounded-md bg-muted/50 pl-9 pr-12 text-sm focus:ring-0 focus:ring-offset-0"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>
                  <Shield className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 bg-background">{children}</div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
