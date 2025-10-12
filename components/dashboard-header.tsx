-'use client';

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardHeaderProps {
  user: {
    name?: string;
    full_name?: string;
    email: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  // Get the display name - prioritize full_name, then name, then extract from email
  const displayName = user.full_name || user.name || user.email?.split('@')[0] || 'User'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left side - Sidebar Trigger and Search */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Right side - User */}
      <div className="flex items-center gap-4">
        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
