'use client';

import React from "react"
import { Suspense } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardProvider } from "@/context/dashboard-context"
import { DebugToggle } from "@/components/ui/debug-panel"
import { GlobalStateProvider } from '@/context/global-state-context';
import { useCrossDashboardSync } from '@/hooks/useCrossDashboardSync';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // Connect to global state
  useCrossDashboardSync('user');
  
  // Get user data from context or use default
  const [userName, setUserName] = React.useState("John");
  
  React.useEffect(() => {
    // Try to get user from cookies first, then localStorage/sessionStorage
    try {
      // Get user data from cookies
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(cookie => cookie.trim().startsWith('trpi_user='));
      
      if (userCookie) {
        const userData = userCookie.split('=')[1];
        const user = JSON.parse(decodeURIComponent(userData));
        const firstName = user.full_name ? user.full_name.split(' ')[0] : "John";
        setUserName(firstName);
        return;
      }
      
      // Fallback to localStorage/sessionStorage
      const storedUser = localStorage.getItem('trpi_user') || sessionStorage.getItem('trpi_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const firstName = user.full_name ? user.full_name.split(' ')[0] : "John";
        setUserName(firstName);
      }
    } catch (error) {
      console.log('Using default user name');
    }
  }, []);
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-white w-full">
        <DashboardSidebar />
        <SidebarInset className="w-full">
          {/* Top Header Bar - Demarcation */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            {/* Search Bar */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search everything..."
                  className="w-full pl-8 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="absolute right-2 top-1.5 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</span>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3">
              <span className="text-gray-700 text-sm font-medium">Hello, {userName}</span>
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <DebugToggle dashboardType="user" />
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <DashboardProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </DashboardProvider>
    </GlobalStateProvider>
  );
}
