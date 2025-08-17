"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Home, Calendar, User, Settings, Bell, CreditCard, FileText } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { useSidebarState } from "@/hooks/useDashboardState"
import { logoutAction } from "@/actions/auth"

// Users sidebar groups
const usersDashboardSidebarGroups = [
  {
    label: "Main",
    items: [{ name: "Dashboard", href: "/users/dashboard", icon: Home }],
  },
  {
    label: "Sessions",
    items: [
      { name: "Book Session", href: "/users/dashboard/book", icon: Calendar },
      { name: "My Sessions", href: "/users/dashboard/sessions", icon: Calendar },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile", href: "/users/dashboard/profile", icon: User },
      { name: "Credits", href: "/users/dashboard/credits", icon: CreditCard },
      { name: "Medical History", href: "/users/dashboard/medical-history", icon: FileText },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notifications", href: "/users/dashboard/notifications", icon: Bell },
    ],
  },
]

// Bottom navigation items
const usersDashboardBottomNavItems = [
  { name: "Settings", href: "/users/dashboard/settings", icon: Settings }
]

export default function UsersDashboardSidebar() {
  const pathname = usePathname()
  const {
    isActive,
    isExpanded,
    handleItemClick,
    handleItemToggle,
    setHover
  } = useSidebarState()

  return (
    <Sidebar 
      className="bg-sidebar-background text-sidebar-foreground" 
      collapsible="icon"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <SidebarHeader className="p-4">
        <Link href="/users/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="light" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            {usersDashboardSidebarGroups.map((group, groupIndex) => (
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
                        onClick={() => handleItemClick(item.href)}
                        className={
                          isActive(item.href)
                            ? "bg-sidebar-active-bg text-sidebar-active-foreground hover:bg-sidebar-active-bg hover:text-sidebar-active-foreground"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[state=collapsed]:hidden">{item.name}</span>
                          {/* Notification badges can be added here when needed */}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                {groupIndex < usersDashboardSidebarGroups.length - 1 && (
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
          {usersDashboardBottomNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                onClick={() => handleItemClick(item.href)}
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
            <form action={logoutAction}>
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
