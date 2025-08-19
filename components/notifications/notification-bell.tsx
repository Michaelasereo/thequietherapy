"use client"

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationPanel } from './notification-panel'
import { useNotifications } from '@/hooks/use-notifications'

interface NotificationBellProps {
  userId: string
  userType: 'individual' | 'therapist' | 'partner' | 'admin'
}

export function NotificationBell({ userId, userType }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, notifications, markAsRead, markAllAsRead, refreshNotifications, loading } = useNotifications(userId)

  // Debug logging
  console.log('🔔 NotificationBell:', { userId, userType, unreadCount, notificationsCount: notifications.length, loading })

  // Don't render if no valid user ID
  if (!userId || userId.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-[#A66B24] text-white border-[#A66B24]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setIsOpen(false)}
          userType={userType}
        />
      )}
    </div>
  )
}
