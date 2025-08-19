"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { NotificationItem } from '@/lib/notifications-client'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, X } from 'lucide-react'

interface NotificationModalProps {
  notification: NotificationItem | null
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (notificationId: string) => void
}

export function NotificationModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead
}: NotificationModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAsRead = async () => {
    if (!notification) return
    
    setIsLoading(true)
    await onMarkAsRead(notification.id)
    setIsLoading(false)
  }

  const handleNavigateToSource = () => {
    if (!notification?.action_url) return
    
    // Mark as read before navigating
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
    
    // Navigate to the source page
    window.location.href = notification.action_url
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'session_booking':
        return 'bg-blue-100 text-blue-800'
      case 'payment_received':
        return 'bg-green-100 text-green-800'
      case 'session_reminder':
        return 'bg-yellow-100 text-yellow-800'
      case 'therapist_approved':
        return 'bg-purple-100 text-purple-800'
      case 'credits_low':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!notification) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Notification Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{notification.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                {!notification.is_read && (
                  <Badge className="text-xs bg-green-600 text-white border-green-600">
                    New
                  </Badge>
                )}
                <Badge className={`text-xs ${getCategoryColor(notification.category)}`}>
                  {notification.category.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Metadata */}
          {notification.metadata && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(notification.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={isLoading}
                >
                  Mark as Read
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {notification.action_url && (
                <Button
                  onClick={handleNavigateToSource}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Page
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
