"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import React, { useEffect, useState, memo } from "react"
import { Logo } from "@/components/ui/logo"
import { adminSidebarGroups, adminBottomNavItems } from "@/lib/admin-data"
import { Badge } from "@/components/ui/badge"
import { useAdminSidebarState } from "@/hooks/useAdminDashboardState"
import { cn } from "@/lib/utils"

const AdminDashboardSidebar = memo(function AdminDashboardSidebar() {
  const pathname = usePathname()
  const {
    activeItem,
    criticalAlerts,
    pendingActions,
    setHover,
    handleItemClick,
    handleItemToggle
  } = useAdminSidebarState()

  // State for real sidebar data
  const [sidebarData, setSidebarData] = useState({
    pendingActions: 0,
    criticalAlerts: 0,
    unreadNotifications: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch real sidebar data - only once on mount
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/sidebar-data', {
          cache: 'no-cache' // Prevent caching issues
        })
        const data = await response.json()
        setSidebarData(data.sidebarData)
      } catch (error) {
        console.error('Error fetching sidebar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSidebarData()
  }, []) // Empty dependency array to ensure it only runs once

  // Simple isActive function using pathname
  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    // Add logout logic here
    window.location.href = '/admin/login'
  }

  return (
    <div className="w-64 bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-2xl">
          <Logo size="md" variant="light" />
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        {adminSidebarGroups.map((group, groupIndex) => (
          <div key={group.label} className="mb-6">
            <h3 className="text-sm font-medium text-sidebar-label-foreground px-2 py-2">
              {group.label}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-active-bg text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.name === 'Therapists' && sidebarData.pendingActions > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {sidebarData.pendingActions}
                    </Badge>
                  )}
                  {item.name === 'Partners' && sidebarData.pendingActions > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {sidebarData.pendingActions}
                    </Badge>
                  )}
                  {item.name === 'Notifications' && sidebarData.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {sidebarData.unreadNotifications}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
            {groupIndex < adminSidebarGroups.length - 1 && (
              <div className="my-4 border-t border-sidebar-border" />
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <nav className="space-y-1">
          {adminBottomNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-active-bg text-sidebar-active-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  )
})

export default AdminDashboardSidebar
