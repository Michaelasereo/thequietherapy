"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, CreditCard } from "lucide-react"
import React, { memo } from "react"
import { Logo } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Brain,
  Heart,
  MessageSquare,
  ShieldCheck,
  Users,
  Home,
  Calendar,
  Video,
  Settings,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  UserCheck,
  BookOpen,
  Leaf,
  Stethoscope,
  Eye,
  List,
  Bell,
} from "lucide-react"
import { useSidebarState } from "@/hooks/useDashboardState"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

// Navigation data - moved from lib/data.ts to eliminate mock data dependency
const dashboardSidebarGroups = [
  {
    label: "Navigation",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Therapy Sessions",
    items: [
      { name: "Book a Session", href: "/dashboard/book", icon: Calendar },
      { name: "Sessions", href: "/dashboard/sessions", icon: Calendar },
      { name: "Go to Therapy", href: "/dashboard/therapy", icon: Video },
    ],
  },
  {
    label: "Medical History",
    items: [
      { name: "Patient Biodata", href: "/dashboard/biodata", icon: Users },
      { name: "Family History", href: "/dashboard/family-history", icon: Users },
      { name: "Social History", href: "/dashboard/social-history", icon: BookOpen },
      { name: "Drug History & Previous Diagnosis", href: "/dashboard/medical-history", icon: Heart },
    ],
  },
]

const dashboardBottomNavItems = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings }
]

const DashboardSidebar = memo(function DashboardSidebar() {
  const pathname = usePathname()
  const { 
    isActive, 
    isExpanded, 
    handleItemClick, 
    handleItemToggle
  } = useSidebarState()
  const { logout } = useAuth()
  const { user } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <Sidebar className="bg-sidebar-background text-sidebar-foreground" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="light" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            {dashboardSidebarGroups.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                <SidebarGroupLabel className="text-sm font-medium text-sidebar-label-foreground px-2 py-2">
                  <span className="group-data-[state=collapsed]:hidden">{group.label}</span>
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isItemActive = isActive(item.name) || pathname === item.href
                    
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive}
                          className={
                            isItemActive
                              ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }
                        >
                          <Link href={item.href} className="relative flex items-center w-full">
                            <item.icon className="h-5 w-5" />
                            <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
                {groupIndex < dashboardSidebarGroups.length - 1 && (
                  <SidebarSeparator className="my-2 mx-2 w-auto bg-sidebar-border" />
                )}
              </React.Fragment>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

                 {/* Credits Section */}
         <SidebarSeparator className="my-2 mx-2 w-auto bg-sidebar-border" />
         <SidebarGroup>
           <SidebarGroupLabel className="text-sm font-medium text-sidebar-label-foreground px-2 py-2">
             <span className="group-data-[state=collapsed]:hidden">Credits</span>
           </SidebarGroupLabel>
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton 
                 asChild
                 isActive={isActive('credits') || pathname === '/dashboard/credits'}
               >
                 <Link href="/dashboard/credits" className="flex items-center w-full">
                   <CreditCard className="h-5 w-5" />
                   <span className="group-data-[state=collapsed]:hidden">Buy Credits</span>
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
         </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarSeparator className="my-2 mx-2 w-auto bg-sidebar-border" />
        <SidebarMenu>
          {dashboardBottomNavItems.map((item) => {
            const isItemActive = isActive(item.name) || pathname === item.href
            
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive}
                  className={
                    isItemActive
                      ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                >
                  <Link href={item.href} className="flex items-center w-full">
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="group-data-[state=collapsed]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
})

export default DashboardSidebar
