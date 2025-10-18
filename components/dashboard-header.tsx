'use client'

import { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { therapistEvents, THERAPIST_EVENTS, AvatarUpdatedData } from '@/lib/events'

interface DashboardHeaderProps {
  user: {
    name?: string
    full_name?: string
    email: string
    profile_image_url?: string  // ✅ STANDARDIZED FIELD NAME
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  // Get the display name - prioritize full_name, then name, then extract from email
  const displayName = user.full_name || user.name || user.email?.split('@')[0] || 'User'
  
  // Local state for avatar with event-driven updates
  const [avatarUrl, setAvatarUrl] = useState(user.profile_image_url)

  // Listen for avatar updates from any component
  useEffect(() => {
    console.log('🔍 DashboardHeader: Component mounted - therapistEvents instance:', {
      instance: therapistEvents,
      eventNames: THERAPIST_EVENTS
    })
    console.log('🎯 DashboardHeader: Setting up event listener...')
    
    const handleAvatarUpdate = (data: AvatarUpdatedData) => {
      console.log('📬 DashboardHeader: EVENT RECEIVED!', {
        data,
        currentAvatarUrl: avatarUrl,
        timestamp: Date.now()
      })
      
      if (data.profile_image_url) {
        console.log('🔄 DashboardHeader: Updating avatar URL from', avatarUrl, 'to', data.profile_image_url)
        setAvatarUrl(data.profile_image_url)
      } else {
        console.warn('⚠️ DashboardHeader: Event received but no profile_image_url in data')
      }
    }

    therapistEvents.on(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
    
    // Test: emit a test event on mount to verify the listener works
    setTimeout(() => {
      console.log('🧪 DashboardHeader: Emitting test event...')
      therapistEvents.emit(THERAPIST_EVENTS.AVATAR_UPDATED, {
        profile_image_url: 'test-url',
        timestamp: Date.now(),
        source: 'test'
      })
    }, 1000)

    return () => {
      console.log('🧹 DashboardHeader: Cleaning up event listener')
      therapistEvents.off(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
    }
  }, [])

  // Update local state when prop changes
  useEffect(() => {
    setAvatarUrl(user.profile_image_url)
  }, [user.profile_image_url])

  // Generate unique key for avatar to force re-render on change
  const avatarKey = avatarUrl ? avatarUrl.split('/').pop() || avatarUrl : 'no-avatar'

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
            <p className="text-sm font-medium text-brand-gold">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <Avatar className="h-8 w-8" key={avatarKey}>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
