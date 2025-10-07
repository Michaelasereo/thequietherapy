-'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Search, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/auth-context';

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { user: authUser } = useAuth();
  const [credits, setCredits] = useState<{ balance: number; totalPurchased: number } | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/user/credits', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCredits(data.credits);
          }
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    if (authUser?.id && !credits) {
      fetchCredits();
    }
  }, [authUser?.id, credits]); // Add credits to dependencies to prevent refetching

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

      {/* Right side - Credits, Notifications and User */}
      <div className="flex items-center gap-4">
        {/* Credits Display */}
        {credits && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <div className="text-right">
              <p className="text-sm font-medium text-blue-900">
                {credits.balance} Credits
              </p>
              <p className="text-xs text-blue-600">
                {credits.totalPurchased} Total
              </p>
            </div>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name || user.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
