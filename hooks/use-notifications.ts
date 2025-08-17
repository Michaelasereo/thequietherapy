"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { NotificationItem, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '@/lib/notifications-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to safely check notification support
const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         typeof Notification !== 'undefined'
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getNotifications(userId, 50)

      if (result.success) {
        setNotifications(result.notifications || [])
      } else {
        setError(result.error || 'Failed to fetch notifications')
      }
    } catch (err) {
      setError('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount(userId)

      if (result.success) {
        setUnreadCount(result.count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await markNotificationRead(notificationId)

      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        )
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllNotificationsRead(userId)

      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        )
        
        // Reset unread count
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [userId])

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchNotifications()
    fetchUnreadCount()

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📢 Real-time notification update:', payload)

          if (payload.eventType === 'INSERT') {
            // New notification
            const newNotification = payload.new as NotificationItem
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Show browser notification if supported
            try {
              if (isNotificationSupported() && Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico'
                })
              }
            } catch (error) {
              console.warn('Could not show browser notification:', error)
            }
          } else if (payload.eventType === 'UPDATE') {
            // Updated notification
            const updatedNotification = payload.new as NotificationItem
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id 
                  ? updatedNotification 
                  : notification
              )
            )

            // Update unread count if notification was marked as read
            if (updatedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          } else if (payload.eventType === 'DELETE') {
            // Deleted notification
            const deletedNotification = payload.old as NotificationItem
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            )
            
            // Update unread count if deleted notification was unread
            if (!deletedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    // Request notification permission
    try {
      if (isNotificationSupported() && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } catch (error) {
      console.warn('Could not request notification permission:', error)
    }

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  }
}
