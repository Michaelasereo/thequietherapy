"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Filter, 
  Search, 
  Trash2, 
  Archive,
  Settings,
  RefreshCw
} from 'lucide-react'
import { NotificationItem } from '@/lib/notifications-client'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/hooks/use-notifications'
import { useAuth } from '@/context/auth-context'
import { NotificationModal } from '@/components/notifications/notification-modal'

export default function DashboardNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { user } = useAuth()
  const userId = user?.id || ''
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications(userId)

  // Filter notifications based on active tab and filters
  const filteredNotifications = notifications.filter(notification => {
    // Tab filtering
    if (activeTab === 'unread' && notification.is_read) return false
    if (activeTab === 'read' && !notification.is_read) return false

    // Type filtering
    if (filterType !== 'all' && notification.type !== filterType) return false

    // Category filtering
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false

    // Search filtering
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  const handleNotificationClick = async (notification: NotificationItem) => {
    setSelectedNotification(notification)
    setIsModalOpen(true)
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  const handleBulkMarkAsRead = async () => {
    for (const notificationId of selectedNotifications) {
      await markAsRead(notificationId)
    }
    setSelectedNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-[#A66B24] bg-[#A66B24]/10'
      default:
        return 'border-blue-200 bg-blue-50'
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and stay updated</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={refreshNotifications} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-[#A66B24] text-white border-[#A66B24] text-xs">
              {unreadCount}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#A66B24]">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Unread notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{notifications.length - unreadCount}</div>
            <p className="text-xs text-muted-foreground">Read notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters & Actions</CardTitle>
            {unreadCount > 0 && (
              <Button 
                onClick={markAllAsRead} 
                variant="outline"
                size="sm"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="session_booking">Session Booking</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="session_reminder">Session Reminder</SelectItem>
                  <SelectItem value="therapist_approved">Therapist Approved</SelectItem>
                  <SelectItem value="credits_low">Credits Low</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Search</label>
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSelectAll}
                variant="outline"
                className="w-full"
              >
                {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark Selected as Read ({selectedNotifications.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-600">
                      {activeTab === 'all' ? 'You have no notifications yet.' : 
                       activeTab === 'unread' ? 'All notifications have been read.' : 
                       'No read notifications found.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className={`cursor-pointer transition-all hover:shadow-lg bg-white shadow-sm border ${
                          notification.is_read ? 'opacity-75' : ''
                        } ${!notification.is_read ? 'border-black' : 'border-gray-200'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                {!notification.is_read && (
                                  <Badge className="text-xs bg-green-600 text-white border-green-600">
                                    New
                                  </Badge>
                                )}
                                <Badge className={`text-xs ${getCategoryColor(notification.category)}`}>
                                  {notification.category.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2">{notification.message}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                                {notification.action_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedNotification(notification)
                                      setIsModalOpen(true)
                                    }}
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  >
                                    View Details
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                >
                                  <Check className="h-4 w-4 text-black" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedNotification(null)
        }}
        onMarkAsRead={markAsRead}
      />
    </div>
  )
}
