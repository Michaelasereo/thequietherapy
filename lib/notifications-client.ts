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

// Get notifications for a user (client-side) - Using API endpoint to avoid RLS issues
export async function getNotifications(userId: string, limit: number = 50): Promise<{ success: boolean; notifications?: NotificationItem[]; error?: string }> {
  try {
    const response = await fetch(`/api/notifications?userId=${userId}&limit=${limit}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const result = await response.json()

    if (result.success) {
      return { success: true, notifications: result.notifications || [] }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('getNotifications error:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// Get unread notifications count (client-side) - Using API endpoint to avoid RLS issues
export async function getUnreadCount(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const response = await fetch(`/api/notifications/unread-count?userId=${userId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const result = await response.json()

    if (result.success) {
      return { success: true, count: result.count || 0 }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('getUnreadCount error:', error)
    return { success: false, error: 'Failed to get unread count' }
  }
}

// Mark notification as read (client-side) - Using API endpoint to avoid RLS issues
export async function markNotificationRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      credentials: 'include'
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const result = await response.json()
    return result.success ? { success: true } : { success: false, error: result.error }
  } catch (error) {
    console.error('❌ markNotificationRead error:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

// Mark all notifications as read for a user (client-side) - Using API endpoint to avoid RLS issues
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        action: 'mark_all_read'
      })
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const result = await response.json()
    return result.success ? { success: true, count: result.count } : { success: false, error: result.error }
  } catch (error) {
    console.error('❌ markAllNotificationsRead error:', error)
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}
