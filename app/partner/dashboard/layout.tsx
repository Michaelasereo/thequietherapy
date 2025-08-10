import type React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { partnerSidebarGroups } from "@/lib/partner-data"
import Link from "next/link"

function PartnerSidebar() {
  return (
    <div className="w-64 border-r h-screen sticky top-0 hidden md:flex flex-col">
      <div className="p-4 text-2xl font-bold">Trpi Partners</div>
      <div className="flex-1 overflow-auto">
        {partnerSidebarGroups.map((group) => (
          <div key={group.label} className="px-3 py-2">
            <div className="text-xs uppercase text-muted-foreground mb-2">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link key={item.name} href={item.href} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <PartnerSidebar />
      <div className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members, credits..."
              className="w-full rounded-md bg-muted/50 pl-9 pr-12 text-sm focus:ring-0 focus:ring-offset-0"
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>PR</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}


