"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default function TestNotificationsClientPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Client-Side Notifications Test</h1>
        <NotificationBell userId="fac0056c-2f16-4417-a1ae-9c63345937c8" userType="individual" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">
            ✅ If you can see this page without errors, the client-side notifications are working correctly!
          </p>
          <p className="text-gray-600 mt-2">
            The notification bell should appear in the top right corner. If there are any errors, they would appear in the browser console.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What was fixed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Problem:</strong> The original error "supabaseKey is required" occurred because we were trying to use the service role key on the client side.
          </p>
          <p className="text-sm text-gray-600">
            <strong>Solution:</strong> Separated client and server-side notification logic:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-4">
            <li><code>lib/notifications-client.ts</code> - Uses anon key for client-side operations</li>
            <li><code>lib/notifications.ts</code> - Uses service role key for server-side operations</li>
            <li>Updated all components to use the client-side functions</li>
            <li>Updated API routes to use direct Supabase calls with service role key</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
