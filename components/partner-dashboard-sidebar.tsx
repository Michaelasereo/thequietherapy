"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, BarChart3, Users, CreditCard, FileText, DollarSign, Settings, Check } from "lucide-react"
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
import { usePartnerSidebarState } from "@/hooks/usePartnerDashboardState"
import { partnerLogoutAction } from "@/actions/partner-auth"

// Partner sidebar groups
const partnerDashboardSidebarGroups = [
  {
    label: "TechCorp Solutions",
    items: [
      { name: "Dashboard", href: "/partner/dashboard", icon: BarChart3 },
      { name: "Members", href: "/partner/dashboard/members", icon: Users },
      { name: "Credits", href: "/partner/dashboard/credits", icon: CreditCard }
    ]
  },
  {
    label: "Management",
    items: [
      { name: "Reports", href: "/partner/dashboard/reports", icon: FileText },
      { name: "Payments", href: "/partner/dashboard/payments", icon: DollarSign },
      { name: "Settings", href: "/partner/dashboard/settings", icon: Settings }
    ]
  }
]

// Bottom navigation items
const partnerDashboardBottomNavItems = [
  { name: "Settings", href: "/partner/dashboard/settings", icon: Settings }
]

export default function PartnerDashboardSidebar() {
  const pathname = usePathname()
  const {
    isActive,
    isExpanded,
    notificationsCount,
    unreadMessages,
    handleItemClick,
    handleItemToggle,
    setHover
  } = usePartnerSidebarState()

  return (
    <Sidebar 
      className="bg-sidebar-background text-sidebar-foreground" 
      collapsible="icon"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <SidebarHeader className="p-4">
        <Link href="/partner/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="dark" />
        </Link>
      </SidebarHeader>
      
      {/* Partner Info Section */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-sidebar-foreground">TechCorp Solutions</span>
            <div className="flex items-center justify-center w-4 h-4 bg-white rounded-full border border-gray-300">
              <Check className="h-2.5 w-2.5 text-black" />
            </div>
          </div>
        </div>
      </div>
      
      <SidebarContent className="flex-1 overflow-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            {partnerDashboardSidebarGroups.map((group, groupIndex) => (
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
                {groupIndex < partnerDashboardSidebarGroups.length - 1 && (
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
          {partnerDashboardBottomNavItems.map((item) => (
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
            <form action={partnerLogoutAction}>
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
