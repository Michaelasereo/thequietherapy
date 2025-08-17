"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
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
import { adminSidebarGroups, adminBottomNavItems } from "@/lib/admin-data"
import { Badge } from "@/components/ui/badge"
import { useAdminSidebarState } from "@/hooks/useAdminDashboardState"
import { cn } from "@/lib/utils"

export default function AdminDashboardSidebar() {
  const pathname = usePathname()
  const {
    activeItem,
    criticalAlerts,
    pendingActions,
    setHover,
    handleItemClick,
    handleItemToggle
  } = useAdminSidebarState()

  // Simple isActive function using pathname
  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    // Add logout logic here
    window.location.href = '/admin/login'
  }

  return (
    <Sidebar 
      className="bg-sidebar-background text-sidebar-foreground" 
      collapsible="icon"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <SidebarHeader className="p-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="light" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            {adminSidebarGroups.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                <SidebarGroupLabel className="text-sm font-medium text-sidebar-label-foreground px-2 py-2">
                  <span className="group-data-[state=collapsed]:hidden">{group.label}</span>
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        onClick={() => handleItemClick(item.name)}
                        className={
                          isActive(item.href)
                            ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                          {item.name === 'Therapists' && pendingActions > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {pendingActions}
                            </Badge>
                          )}
                          {item.name === 'Partners' && pendingActions > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {pendingActions}
                            </Badge>
                          )}
                          {item.name === 'Notifications' && criticalAlerts > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {criticalAlerts}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                {groupIndex < adminSidebarGroups.length - 1 && (
                  <SidebarSeparator className="my-2 mx-2 w-auto bg-sidebar-border" />
                )}
              </React.Fragment>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarSeparator className="my-2 mx-2 w-auto bg-sidebar-border" />
        <SidebarMenu>
          {adminBottomNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                onClick={() => handleItemClick(item.name)}
                className={
                  isActive(item.href)
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
          ))}
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
