'use client'

import { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { therapistEvents, THERAPIST_EVENTS, AvatarUpdatedData } from '@/lib/events'

interface TherapistHeaderProps {
  user: {
    name?: string
    full_name?: string
    email: string
    profile_image_url?: string  // ✅ STANDARDIZED FIELD NAME
  }
}

export default function TherapistHeader({ user }: TherapistHeaderProps) {
  // Get the display name - prioritize full_name, then name, then extract from email
  const displayName = user.full_name || user.name || user.email?.split('@')[0] || 'Therapist'
  
  // Local state for avatar with event-driven updates
  const [avatarUrl, setAvatarUrl] = useState(user.profile_image_url)

  // Listen for avatar updates from any component
  useEffect(() => {
    const handleAvatarUpdate = (data: AvatarUpdatedData) => {
      console.log('📸 TherapistHeader: Avatar updated event received:', data)
      setAvatarUrl(data.profile_image_url)
    }

    therapistEvents.on(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)

    return () => {
      therapistEvents.off(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
    }
  }, [])

  // Update local state when prop changes
  useEffect(() => {
    setAvatarUrl(user.profile_image_url)
  }, [user.profile_image_url])

  // Generate unique key for avatar to force re-render on change
  // Use just the filename from the URL to create a stable but unique key
  const avatarKey = avatarUrl ? avatarUrl.split('/').pop() || avatarUrl : 'no-avatar'
  
  console.log('🔍 TherapistHeader: Received user data:', user)
  console.log('🔍 TherapistHeader: displayName resolved to:', displayName)
  console.log('🔍 TherapistHeader: profile_image_url:', avatarUrl)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left side - Sidebar Trigger and Search */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions, clients..."
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
          <Avatar className="h-8 w-8" key={avatarKey}>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
