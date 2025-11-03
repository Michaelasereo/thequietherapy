'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.profile_image_url)
  
  // Cache-busting version tracker
  const [avatarVersion, setAvatarVersion] = useState(0)

  // Track previous prop value to detect changes (handles reload scenarios)
  const prevProfileImageUrlRef = useRef<string | undefined>(user.profile_image_url)

  // Update local state when prop changes (handles reload scenarios)
  useEffect(() => {
    const newProfileImageUrl = user.profile_image_url || undefined
    const prevProfileImageUrl = prevProfileImageUrlRef.current
    
    // Only update if prop actually changed (handles both undefined -> defined and defined -> different)
    if (newProfileImageUrl !== prevProfileImageUrl) {
      console.log('🔄 DashboardHeader: Updating avatar from prop:', {
        old: prevProfileImageUrl,
        new: newProfileImageUrl
      })
      setAvatarUrl(newProfileImageUrl)
      prevProfileImageUrlRef.current = newProfileImageUrl
      // Increment version when prop changes to bust cache
      if (newProfileImageUrl) {
        setAvatarVersion(prev => prev + 1)
      }
    }
  }, [user.profile_image_url]) // Only depend on prop to avoid loops

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
        // Increment version to bust cache
        setAvatarVersion(prev => prev + 1)
      } else {
        console.warn('⚠️ DashboardHeader: Event received but no profile_image_url in data')
      }
    }

    therapistEvents.on(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)

    return () => {
      console.log('🧹 DashboardHeader: Cleaning up event listener')
      therapistEvents.off(THERAPIST_EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
    }
  }, [])

  // Add cache-busting parameter to avatar URL
  const avatarUrlWithCacheBust = avatarUrl 
    ? `${avatarUrl}?v=${avatarVersion}`
    : undefined

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
          <Avatar className="h-8 w-8" key={`avatar-${avatarVersion}`}>
            <AvatarImage 
              src={avatarUrlWithCacheBust} 
              alt={displayName}
              key={`avatar-img-${avatarVersion}`}
            />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
