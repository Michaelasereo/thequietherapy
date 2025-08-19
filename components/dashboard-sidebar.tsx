"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, CreditCard } from "lucide-react"
import React from "react"
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
import { dashboardSidebarGroups, dashboardBottomNavItems, mockUser } from "@/lib/data"
import { useSidebarState } from "@/hooks/useDashboardState"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { 
    isActive, 
    isExpanded, 
    handleItemClick, 
    handleItemToggle
  } = useSidebarState()
  const { logout } = useAuth()
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.id || '')

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
                    const isNotificationsItem = item.name === "Notifications"
                    
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive}
                          onClick={() => handleItemClick(item.name)}
                          className={
                            isItemActive
                              ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }
                        >
                          <Link href={item.href} className="relative flex items-center">
                            <item.icon className="h-5 w-5" />
                            <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                            {isNotificationsItem && unreadCount > 0 && (
                              <Badge 
                                className="ml-auto h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center group-data-[state=collapsed]:hidden bg-[#A66B24] text-white border-[#A66B24]"
                              >
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Badge>
                            )}
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
                 onClick={() => handleItemClick('credits')}
               >
                 <Link href="/dashboard/credits">
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
                  onClick={() => handleItemClick(item.name)}
                  className={
                    isItemActive
                      ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                >
                  <Link href={item.href}>
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
}
