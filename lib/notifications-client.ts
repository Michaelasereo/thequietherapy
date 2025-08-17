import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface NotificationItem {
  id: string
  user_id: string
  user_type: string
  title: string
  message: string
  type: string
  category: string
  is_read: boolean
  action_url?: string
  metadata?: any
  created_at: string
  read_at?: string
}

// Get notifications for a user (client-side)
export async function getNotifications(userId: string, limit: number = 50): Promise<{ success: boolean; notifications?: NotificationItem[]; error?: string }> {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching notifications:', error)
      return { success: false, error: error.message }
    }

    return { success: true, notifications: notifications || [] }
  } catch (error) {
    console.error('❌ getNotifications error:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// Get unread notifications count (client-side)
export async function getUnreadCount(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: count, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId
    })

    if (error) {
      console.error('❌ Error getting unread count:', error)
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('❌ getUnreadCount error:', error)
    return { success: false, error: 'Failed to get unread count' }
  }
}

// Mark notification as read (client-side)
export async function markNotificationRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    })

    if (error) {
      console.error('❌ Error marking notification as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('❌ markNotificationRead error:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

// Mark all notifications as read for a user (client-side)
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: count, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: userId
    })

    if (error) {
      console.error('❌ Error marking all notifications as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('❌ markAllNotificationsRead error:', error)
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}
