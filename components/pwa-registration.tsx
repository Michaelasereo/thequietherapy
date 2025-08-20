'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Bell, Wifi, WifiOff } from 'lucide-react'

export function PWARegistration() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowInstallPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }

  const sendTestNotification = () => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Quiet Therapy', {
          body: 'This is a test notification from your PWA!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        })
      })
    }
  }

  if (isInstalled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            PWA Installed
          </CardTitle>
          <CardDescription>
            Your app is installed and ready to use offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm">
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">
              Notifications: {notificationPermission}
            </span>
            {notificationPermission === 'granted' && (
              <Button
                size="sm"
                variant="outline"
                onClick={sendTestNotification}
              >
                Test
              </Button>
            )}
          </div>

          {notificationPermission !== 'granted' && (
            <Button
              onClick={requestNotificationPermission}
              variant="outline"
              size="sm"
            >
              Enable Notifications
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Install Quiet Therapy
        </CardTitle>
        <CardDescription>
          Install our app for a better experience with offline support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Offline access to your sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Push notifications for updates</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Faster loading times</span>
          </div>
        </div>

        {showInstallPrompt && (
          <Button onClick={handleInstallClick} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        )}

        {!showInstallPrompt && (
          <div className="text-center text-sm text-muted-foreground">
            Install prompt will appear when available
          </div>
        )}

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-500" />
          )}
          <span className="text-sm">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default PWARegistration
