"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Check } from "lucide-react"
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
import { therapistDashboardSidebarGroups, therapistDashboardBottomNavItems } from "@/lib/therapist-data"
import { Badge } from "@/components/ui/badge"
import { useTherapistUser } from "@/context/therapist-user-context"
import { useTherapistSidebarState } from "@/hooks/useTherapistDashboardState"
import { therapistLogoutAction } from "@/actions/therapist-auth"

export default function TherapistDashboardSidebar() {
  const pathname = usePathname()
  const { therapistUser } = useTherapistUser()
  const {
    notificationsCount,
    unreadMessages,
    handleItemClick,
    handleItemToggle,
    setHover
  } = useTherapistSidebarState()

  // Simple isActive function using pathname
  const isActive = (href: string) => pathname === href

  return (
    <Sidebar 
      className="bg-sidebar-background text-sidebar-foreground" 
      collapsible="icon"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <SidebarHeader className="p-4">
        <Link href="/therapist/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="light" />
        </Link>
      </SidebarHeader>
      

      
      <SidebarContent className="flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            {therapistDashboardSidebarGroups.map((group, groupIndex) => (
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
                        className={
                          isActive(item.href)
                            ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                          {item.name === 'Notifications' && notificationsCount > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {notificationsCount}
                            </Badge>
                          )}
                          {item.name === 'Messages' && unreadMessages > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {unreadMessages}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                {groupIndex < therapistDashboardSidebarGroups.length - 1 && (
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
          {therapistDashboardBottomNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
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
            <form action={therapistLogoutAction}>
              <SidebarMenuButton type="submit">
                <LogOut className="h-5 w-5" />
                <span className="group-data-[state=collapsed]:hidden">Logout</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
