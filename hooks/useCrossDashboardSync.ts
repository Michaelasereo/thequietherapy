"use client"

import { useCallback, useEffect, useMemo } from 'react'
import { useGlobalState } from '@/context/global-state-context'

// Hook for cross-dashboard synchronization
export function useCrossDashboardSync(dashboardType: 'user' | 'therapist' | 'partner' | 'admin') {
  const globalState = useGlobalState()

  // Connect to global state when component mounts
  useEffect(() => {
    globalState.connectDashboard(dashboardType)
    
    return () => {
      globalState.disconnectDashboard(dashboardType)
    }
  }, [dashboardType]) // Remove globalState from dependencies to prevent infinite loops

  // Process unprocessed events for this dashboard - disabled to prevent infinite loops
  // useEffect(() => {
  //   const unprocessedEvents = globalState.getUnprocessedEvents(dashboardType)
  //   
  //   if (unprocessedEvents.length > 0) {
  //     unprocessedEvents.forEach(event => {
  //       handleCrossDashboardEvent(event)
  //       globalState.markEventProcessed(event.id, dashboardType)
  //     })
  //   }
  // }, [dashboardType, globalState.state.events.length, handleCrossDashboardEvent])

  // Handle cross-dashboard events
  const handleCrossDashboardEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'user_status_change':
        handleUserStatusChange(event.data)
        break
      case 'session_status_change':
        handleSessionStatusChange(event.data)
        break
      case 'notification':
        handleGlobalNotification(event.data)
        break
      case 'system_alert':
        handleSystemAlert(event.data)
        break
      case 'data_sync':
        handleDataSync(event.data)
        break
      default:
        console.log('Unknown event type:', event.type)
    }
  }, [])

  // Handle user status changes
  const handleUserStatusChange = useCallback((data: { userId: string; status: string }) => {
    // Log the event for debugging
    console.log(`User status change event for ${dashboardType}:`, data)
    
    // Update global state
    globalState.updateUserStatus(data.userId, data.status)
  }, [dashboardType, globalState])

  // Handle session status changes
  const handleSessionStatusChange = useCallback((data: { sessionId: string; status: string }) => {
    // Log the event for debugging
    console.log(`Session status change event for ${dashboardType}:`, data)
    
    // Update global state
    globalState.updateSessionStatus(data.sessionId, data.status)
  }, [dashboardType, globalState])

  // Handle global notifications
  const handleGlobalNotification = useCallback((data: any) => {
    console.log(`Global notification event for ${dashboardType}:`, data)
    
    // Update global state with notification
    globalState.addGlobalNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity || 'medium',
      target_user_types: [dashboardType],
      requires_action: data.requiresAction || false
    })
  }, [dashboardType, globalState])

  // Handle system alerts
  const handleSystemAlert = useCallback((data: any) => {
    console.log(`System alert event for ${dashboardType}:`, data)
    
    // Only admin dashboard handles system alerts
    if (dashboardType === 'admin') {
      globalState.addGlobalNotification({
        type: 'system_alert',
        title: data.title,
        message: data.message,
        severity: data.severity || 'high',
        target_user_types: ['admin'],
        requires_action: data.requiresAction || false
      })
    }
  }, [dashboardType, globalState])

  // Handle data synchronization
  const handleDataSync = useCallback((data: any) => {
    console.log(`Data sync event for ${dashboardType}:`, data)
    
    // Update global sync state
    globalState.updateSyncState({
      lastSync: new Date().toISOString(),
      status: 'completed',
      recordsProcessed: data.recordsProcessed || 0
    })
  }, [dashboardType, globalState])

  return {
    isConnected: globalState.state.connectedDashboards[dashboardType],
    activeUsers: globalState.state.activeUsers,
    activeSessions: globalState.state.activeSessions,
    systemMetrics: globalState.state.systemMetrics,
    isSystemHealthy: globalState.state.isSystemHealthy,
    maintenanceMode: globalState.state.maintenanceMode,
    lastDataSync: globalState.state.lastDataSync,
    syncState: globalState.state.syncState
  }
}

// Hook for broadcasting events to other dashboards
export function useCrossDashboardBroadcast() {
  const globalState = useGlobalState()

  const broadcastUserStatusChange = useCallback((userId: string, status: string, sourceDashboard: string) => {
    globalState.broadcastEvent({
      type: 'user_status_change',
      source_dashboard: sourceDashboard as any,
      target_dashboards: ['user', 'therapist', 'partner', 'admin'],
      data: { userId, status }
    })
  }, [globalState])

  const broadcastSessionStatusChange = useCallback((sessionId: string, status: string, sourceDashboard: string) => {
    globalState.broadcastEvent({
      type: 'session_status_change',
      source_dashboard: sourceDashboard as any,
      target_dashboards: ['user', 'therapist', 'partner', 'admin'],
      data: { sessionId, status }
    })
  }, [globalState])

  const broadcastNotification = useCallback((notification: any, sourceDashboard: string, targetDashboards: string[]) => {
    globalState.broadcastEvent({
      type: 'notification',
      source_dashboard: sourceDashboard as any,
      target_dashboards: targetDashboards as any,
      data: notification
    })
  }, [globalState])

  const broadcastSystemAlert = useCallback((alert: any, sourceDashboard: string) => {
    globalState.broadcastEvent({
      type: 'system_alert',
      source_dashboard: sourceDashboard as any,
      target_dashboards: ['admin'],
      data: alert
    })
  }, [globalState])

  const broadcastDataSync = useCallback((data: any, sourceDashboard: string) => {
    globalState.broadcastEvent({
      type: 'data_sync',
      source_dashboard: sourceDashboard as any,
      target_dashboards: ['user', 'therapist', 'partner', 'admin'],
      data
    })
  }, [globalState])

  return {
    broadcastUserStatusChange,
    broadcastSessionStatusChange,
    broadcastNotification,
    broadcastSystemAlert,
    broadcastDataSync
  }
}

// Hook for real-time updates
export function useRealTimeUpdates() {
  const globalState = useGlobalState()

  const enableUpdates = useCallback((interval?: number) => {
    globalState.enableRealTimeUpdates(interval)
  }, [globalState])

  const disableUpdates = useCallback(() => {
    globalState.disableRealTimeUpdates()
  }, [globalState])

  const manualSync = useCallback(() => {
    globalState.syncData()
  }, [globalState])

  return {
    isEnabled: globalState.state.realTimeUpdates.enabled,
    lastUpdate: globalState.state.realTimeUpdates.lastUpdate,
    updateInterval: globalState.state.realTimeUpdates.updateInterval,
    enableUpdates,
    disableUpdates,
    manualSync,
    isSyncing: globalState.state.syncState.isSyncing,
    lastSyncTime: globalState.state.syncState.lastSyncTime,
    syncErrors: globalState.state.syncState.syncErrors
  }
}

// Hook for global notifications
export function useGlobalNotifications(userType: string, userId?: string) {
  const globalState = useGlobalState()

  const notifications = useMemo(() => {
    return globalState.getNotificationsForUser(userType, userId)
  }, [globalState.state.notifications, userType, userId])

  const markAsRead = useCallback((notificationId: string) => {
    if (userId) {
      globalState.markNotificationRead(notificationId, userId)
    }
  }, [globalState, userId])

  const addNotification = useCallback((notification: any) => {
    globalState.addGlobalNotification({
      ...notification,
      target_user_types: [userType as any],
      target_user_ids: userId ? [userId] : undefined
    })
  }, [globalState, userType, userId])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read_by.includes(userId || '')).length,
    markAsRead,
    addNotification
  }
}

// Hook for system health monitoring
export function useSystemHealth() {
  const globalState = useGlobalState()

  const setSystemHealth = useCallback((healthy: boolean) => {
    globalState.setSystemHealth(healthy)
  }, [globalState])

  const setMaintenanceMode = useCallback((enabled: boolean) => {
    globalState.setMaintenanceMode(enabled)
  }, [globalState])

  const updateUserStatus = useCallback((userId: string, status: string) => {
    globalState.updateUserStatus(userId, status as any)
  }, [globalState])

  const updateSessionStatus = useCallback((sessionId: string, status: string) => {
    globalState.updateSessionStatus(sessionId, status as any)
  }, [globalState])

  return {
    isSystemHealthy: globalState.state.isSystemHealthy,
    maintenanceMode: globalState.state.maintenanceMode,
    systemMetrics: globalState.state.systemMetrics,
    activeUsers: globalState.state.activeUsers,
    activeSessions: globalState.state.activeSessions,
    setSystemHealth,
    setMaintenanceMode,
    updateUserStatus,
    updateSessionStatus
  }
}
