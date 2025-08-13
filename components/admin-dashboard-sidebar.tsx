'use client';

import Link from "next/link";
import { useAdminSidebarState } from "@/hooks/useAdminDashboardState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  Bell, 
  MessageSquare,
  Database,
  Activity,
  Cog
} from "lucide-react";

interface SidebarMenuButtonProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

function SidebarMenuButton({ 
  href, 
  icon, 
  children, 
  isActive, 
  onClick,
  badge 
}: SidebarMenuButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className="w-full justify-start gap-3 h-12"
        onClick={onClick}
      >
        {icon}
        <span className="flex-1 text-left">{children}</span>
        {badge && badge > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {badge}
          </Badge>
        )}
      </Button>
    </Link>
  );
}

export default function AdminDashboardSidebar() {
  const {
    activeItem,
    hoveredItem,
    notificationCount,
    messageCount,
    setActiveItem,
    setHoveredItem
  } = useAdminSidebarState();

  const menuItems = [
    {
      href: "/admin/dashboard",
      icon: <Shield className="h-5 w-5" />,
      label: "Overview",
      key: "overview"
    },
    {
      href: "/admin/dashboard/users",
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      key: "users"
    },
    {
      href: "/admin/dashboard/system",
      icon: <Database className="h-5 w-5" />,
      label: "System",
      key: "system"
    },
    {
      href: "/admin/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Analytics",
      key: "analytics"
    },
    {
      href: "/admin/dashboard/activity",
      icon: <Activity className="h-5 w-5" />,
      label: "Activity",
      key: "activity"
    },
    {
      href: "/admin/dashboard/settings",
      icon: <Cog className="h-5 w-5" />,
      label: "Settings",
      key: "settings"
    }
  ];

  return (
    <div className="flex flex-col w-64 bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">TRPI Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <SidebarMenuButton
            key={item.key}
            href={item.href}
            icon={item.icon}
            isActive={activeItem === item.key}
            onClick={() => setActiveItem(item.key)}
          >
            {item.label}
          </SidebarMenuButton>
        ))}
      </nav>

      {/* Communication */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <SidebarMenuButton
          href="/admin/dashboard/notifications"
          icon={<Bell className="h-5 w-5" />}
          isActive={activeItem === "notifications"}
          onClick={() => setActiveItem("notifications")}
          badge={notificationCount}
        >
          Notifications
        </SidebarMenuButton>
        
        <SidebarMenuButton
          href="/admin/dashboard/messages"
          icon={<MessageSquare className="h-5 w-5" />}
          isActive={activeItem === "messages"}
          onClick={() => setActiveItem("messages")}
          badge={messageCount}
        >
          Messages
        </SidebarMenuButton>
      </div>
    </div>
  );
}
