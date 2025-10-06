"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react'

// Global state interfaces
export interface GlobalUser {
  id: string
  full_name: string
  email: string
  user_type: 'user' | 'therapist' | 'partner' | 'admin'
  is_verified: boolean
  is_active: boolean
  last_activity: string
  online_status: 'online' | 'offline' | 'away' | 'busy'
  current_session?: string
  avatar_url?: string
}

export interface GlobalSession {
  id: string
  user_id: string
  therapist_id?: string
  partner_id?: string
  session_type: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'no-show'
  start_time: string
  end_time?: string
  duration: number
  cost: number
  room_url?: string
  notes?: string
  created_at: string
}

export interface GlobalNotification {
  id: string
  type: 'system' | 'session' | 'payment' | 'security' | 'performance'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  target_user_types: ('user' | 'therapist' | 'partner' | 'admin')[]
  target_user_ids?: string[]
  read_by: string[]
  created_at: string
  expires_at?: string
  requires_action: boolean
  action_taken?: string
}

export interface SystemMetrics {
  totalActiveUsers: number
  totalActiveSessions: number
  systemLoad: number
  responseTime: number
  errorRate: number
  uptime: number
  lastUpdated: string
}

export interface CrossDashboardEvent {
  id: string
  type: 'user_status_change' | 'session_status_change' | 'notification' | 'system_alert' | 'data_sync'
  source_dashboard: 'user' | 'therapist' | 'partner' | 'admin'
  target_dashboards: ('user' | 'therapist' | 'partner' | 'admin')[]
  data: any
  timestamp: string
  processed_by: string[]
}

// Global state interface
export interface GlobalState {
  // Real-time data
  activeUsers: GlobalUser[]
  activeSessions: GlobalSession[]
  systemMetrics: SystemMetrics | null
  
  // Cross-dashboard communication
  notifications: GlobalNotification[]
  events: CrossDashboardEvent[]
  
  // System state
  isSystemHealthy: boolean
  maintenanceMode: boolean
  lastDataSync: string
  
  // Dashboard connections
  connectedDashboards: {
    user: boolean
    therapist: boolean
    partner: boolean
    admin: boolean
  }
  
  // Real-time updates
  realTimeUpdates: {
    enabled: boolean
    lastUpdate: string
    updateInterval: number
  }
  
  // Data synchronization
  syncState: {
    isSyncing: boolean
    lastSyncTime: string
    syncErrors: string[]
    pendingUpdates: number
  }
}

// Action types
export type GlobalStateAction =
  | { type: 'SET_ACTIVE_USERS'; payload: GlobalUser[] }
  | { type: 'UPDATE_USER_STATUS'; payload: { userId: string; status: GlobalUser['online_status'] } }
  | { type: 'SET_ACTIVE_SESSIONS'; payload: GlobalSession[] }
  | { type: 'UPDATE_SESSION_STATUS'; payload: { sessionId: string; status: GlobalSession['status'] } }
  | { type: 'SET_SYSTEM_METRICS'; payload: SystemMetrics }
  | { type: 'ADD_GLOBAL_NOTIFICATION'; payload: GlobalNotification }
  | { type: 'REMOVE_GLOBAL_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { notificationId: string; userId: string } }
  | { type: 'ADD_CROSS_DASHBOARD_EVENT'; payload: CrossDashboardEvent }
  | { type: 'MARK_EVENT_PROCESSED'; payload: { eventId: string; dashboard: string } }
  | { type: 'SET_SYSTEM_HEALTH'; payload: boolean }
  | { type: 'SET_MAINTENANCE_MODE'; payload: boolean }
  | { type: 'UPDATE_LAST_DATA_SYNC'; payload: string }
  | { type: 'SET_DASHBOARD_CONNECTION'; payload: { dashboard: keyof GlobalState['connectedDashboards']; connected: boolean } }
  | { type: 'SET_REAL_TIME_UPDATES'; payload: { enabled: boolean; interval?: number } }
  | { type: 'UPDATE_SYNC_STATE'; payload: Partial<GlobalState['syncState']> }

// Initial state
const initialState: GlobalState = {
  activeUsers: [],
  activeSessions: [],
  systemMetrics: null,
  notifications: [],
  events: [],
  isSystemHealthy: true,
  maintenanceMode: false,
  lastDataSync: new Date().toISOString(),
  connectedDashboards: {
    user: false,
    therapist: false,
    partner: false,
    admin: false
  },
  realTimeUpdates: {
    enabled: false, // Disabled by default to prevent constant reloading
    lastUpdate: new Date().toISOString(),
    updateInterval: 30000 // 30 seconds
  },
  syncState: {
    isSyncing: false,
    lastSyncTime: new Date().toISOString(),
    syncErrors: [],
    pendingUpdates: 0
  }
}

// Reducer function
function globalStateReducer(state: GlobalState, action: GlobalStateAction): GlobalState {
  switch (action.type) {
    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.payload }
    
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        activeUsers: state.activeUsers.map(user =>
          user.id === action.payload.userId
            ? { ...user, online_status: action.payload.status }
            : user
        )
      }
    
    case 'SET_ACTIVE_SESSIONS':
      return { ...state, activeSessions: action.payload }
    
    case 'UPDATE_SESSION_STATUS':
      return {
        ...state,
        activeSessions: state.activeSessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, status: action.payload.status }
            : session
        )
      }
    
    case 'SET_SYSTEM_METRICS':
      return { ...state, systemMetrics: action.payload }
    
    case 'ADD_GLOBAL_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      }
    
    case 'REMOVE_GLOBAL_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.notificationId
            ? {
                ...notification,
                read_by: [...notification.read_by, action.payload.userId]
              }
            : notification
        )
      }
    
    case 'ADD_CROSS_DASHBOARD_EVENT':
      return {
        ...state,
        events: [action.payload, ...state.events]
      }
    
    case 'MARK_EVENT_PROCESSED':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.eventId
            ? {
                ...event,
                processed_by: [...event.processed_by, action.payload.dashboard]
              }
            : event
        )
      }
    
    case 'SET_SYSTEM_HEALTH':
      return { ...state, isSystemHealthy: action.payload }
    
    case 'SET_MAINTENANCE_MODE':
      return { ...state, maintenanceMode: action.payload }
    
    case 'UPDATE_LAST_DATA_SYNC':
      return { ...state, lastDataSync: action.payload }
    
    case 'SET_DASHBOARD_CONNECTION':
      return {
        ...state,
        connectedDashboards: {
          ...state.connectedDashboards,
          [action.payload.dashboard]: action.payload.connected
        }
      }
    
    case 'SET_REAL_TIME_UPDATES':
      return {
        ...state,
        realTimeUpdates: {
          ...state.realTimeUpdates,
          enabled: action.payload.enabled,
          updateInterval: action.payload.interval || state.realTimeUpdates.updateInterval
        }
      }
    
    case 'UPDATE_SYNC_STATE':
      return {
        ...state,
        syncState: {
          ...state.syncState,
          ...action.payload
        }
      }
    
    default:
      return state
  }
}

// Context
const GlobalStateContext = createContext<{
  state: GlobalState
  dispatch: React.Dispatch<GlobalStateAction>
  // Data fetching
  fetchActiveUsers: () => Promise<void>
  fetchActiveSessions: () => Promise<void>
  fetchSystemMetrics: () => Promise<void>
  // User management
  updateUserStatus: (userId: string, status: GlobalUser['online_status']) => void
  // Session management
  updateSessionStatus: (sessionId: string, status: GlobalSession['status']) => void
  // Notifications
  addGlobalNotification: (notification: Omit<GlobalNotification, 'id' | 'created_at'>) => void
  markNotificationRead: (notificationId: string, userId: string) => void
  // Cross-dashboard events
  broadcastEvent: (event: Omit<CrossDashboardEvent, 'id' | 'timestamp' | 'processed_by'>) => void
  markEventProcessed: (eventId: string, dashboard: string) => void
  // System management
  setSystemHealth: (healthy: boolean) => void
  setMaintenanceMode: (enabled: boolean) => void
  // Dashboard connections
  connectDashboard: (dashboard: keyof GlobalState['connectedDashboards']) => void
  disconnectDashboard: (dashboard: keyof GlobalState['connectedDashboards']) => void
  // Real-time updates
  enableRealTimeUpdates: (interval?: number) => void
  disableRealTimeUpdates: () => void
  // Data synchronization
  syncData: () => Promise<void>
  getUnprocessedEvents: (dashboard: string) => CrossDashboardEvent[]
  getNotificationsForUser: (userType: string, userId?: string) => GlobalNotification[]
} | undefined>(undefined)

// Provider component
export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalStateReducer, initialState)

  // Data fetching functions - memoized with useCallback
  const fetchActiveUsers = useCallback(async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockActiveUsers: GlobalUser[] = [
        {
          id: 'user-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          user_type: 'user',
          is_verified: true,
          is_active: true,
          last_activity: new Date().toISOString(),
          online_status: 'online'
        },
        {
          id: 'therapist-1',
          full_name: 'Dr. Sarah White',
          email: 'sarah@therapy.com',
          user_type: 'therapist',
          is_verified: true,
          is_active: true,
          last_activity: new Date().toISOString(),
          online_status: 'busy',
          current_session: 'session-1'
        }
      ]
      dispatch({ type: 'SET_ACTIVE_USERS', payload: mockActiveUsers })
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }, [])

  const fetchActiveSessions = useCallback(async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockActiveSessions: GlobalSession[] = [
        {
          id: 'session-1',
          user_id: 'user-1',
          therapist_id: 'therapist-1',
          session_type: 'CBT Session',
          status: 'active',
          start_time: new Date().toISOString(),
          duration: 60,
          cost: 150,
          room_url: 'https://meet.jit.si/session-1',
          created_at: new Date().toISOString()
        }
      ]
      dispatch({ type: 'SET_ACTIVE_SESSIONS', payload: mockActiveSessions })
    } catch (error) {
      console.error('Error fetching active sessions:', error)
    }
  }, [])

  const fetchSystemMetrics = useCallback(async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSystemMetrics: SystemMetrics = {
        totalActiveUsers: 45,
        totalActiveSessions: 12,
        systemLoad: 0.65,
        responseTime: 150,
        errorRate: 0.02,
        uptime: 99.9,
        lastUpdated: new Date().toISOString()
      }
      dispatch({ type: 'SET_SYSTEM_METRICS', payload: mockSystemMetrics })
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    }
  }, [])

  // User management - memoized with useCallback
  const updateUserStatus = useCallback((userId: string, status: GlobalUser['online_status']) => {
    dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, status } })
  }, [])

  // Session management - memoized with useCallback
  const updateSessionStatus = useCallback((sessionId: string, status: GlobalSession['status']) => {
    dispatch({ type: 'UPDATE_SESSION_STATUS', payload: { sessionId, status } })
  }, [])

  // Notifications - memoized with useCallback
  const addGlobalNotification = useCallback((notification: Omit<GlobalNotification, 'id' | 'created_at'>) => {
    const newNotification: GlobalNotification = {
      ...notification,
      id: `notification-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    dispatch({ type: 'ADD_GLOBAL_NOTIFICATION', payload: newNotification })
  }, [])

  const markNotificationRead = useCallback((notificationId: string, userId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId, userId } })
  }, [])

  // Cross-dashboard events - memoized with useCallback
  const broadcastEvent = useCallback((event: Omit<CrossDashboardEvent, 'id' | 'timestamp' | 'processed_by'>) => {
    const newEvent: CrossDashboardEvent = {
      ...event,
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      processed_by: []
    }
    dispatch({ type: 'ADD_CROSS_DASHBOARD_EVENT', payload: newEvent })
  }, [])

  const markEventProcessed = useCallback((eventId: string, dashboard: string) => {
    dispatch({ type: 'MARK_EVENT_PROCESSED', payload: { eventId, dashboard } })
  }, [])

  // System management - memoized with useCallback
  const setSystemHealth = useCallback((healthy: boolean) => {
    dispatch({ type: 'SET_SYSTEM_HEALTH', payload: healthy })
  }, [])

  const setMaintenanceMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_MAINTENANCE_MODE', payload: enabled })
  }, [])

  // Dashboard connections - memoized with useCallback
  const connectDashboard = useCallback((dashboard: keyof GlobalState['connectedDashboards']) => {
    dispatch({ type: 'SET_DASHBOARD_CONNECTION', payload: { dashboard, connected: true } })
  }, [])

  const disconnectDashboard = useCallback((dashboard: keyof GlobalState['connectedDashboards']) => {
    dispatch({ type: 'SET_DASHBOARD_CONNECTION', payload: { dashboard, connected: false } })
  }, [])

  // Real-time updates - memoized with useCallback
  const enableRealTimeUpdates = useCallback((interval?: number) => {
    dispatch({ type: 'SET_REAL_TIME_UPDATES', payload: { enabled: true, interval } })
  }, [])

  const disableRealTimeUpdates = useCallback(() => {
    dispatch({ type: 'SET_REAL_TIME_UPDATES', payload: { enabled: false } })
  }, [])

  // Data synchronization - memoized with useCallback
  const syncData = useCallback(async () => {
    dispatch({ type: 'UPDATE_SYNC_STATE', payload: { isSyncing: true } })
    try {
      await fetchActiveUsers()
      await fetchActiveSessions()
      await fetchSystemMetrics()
      dispatch({ type: 'UPDATE_SYNC_STATE', payload: { 
        isSyncing: false, 
        lastSyncTime: new Date().toISOString(),
        syncErrors: []
      } })
    } catch (error) {
      dispatch({ type: 'UPDATE_SYNC_STATE', payload: { 
        isSyncing: false,
        syncErrors: [...state.syncState.syncErrors, error as string]
      } })
    }
  }, [fetchActiveUsers, fetchActiveSessions, fetchSystemMetrics, state.syncState.syncErrors])

  // Helper functions - memoized with useCallback
  const getUnprocessedEvents = useCallback((dashboard: string): CrossDashboardEvent[] => {
    return state.events.filter(event => 
      event.target_dashboards.includes(dashboard as any) && 
      !event.processed_by.includes(dashboard)
    )
  }, [state.events])

  const getNotificationsForUser = useCallback((userType: string, userId?: string): GlobalNotification[] => {
    return state.notifications.filter(notification => {
      const isTargetUserType = notification.target_user_types.includes(userType as any)
      const isTargetUser = !notification.target_user_ids || 
        (userId && notification.target_user_ids.includes(userId))
      const isNotRead = !userId || !notification.read_by.includes(userId)
      
      return isTargetUserType && isTargetUser && isNotRead
    })
  }, [state.notifications])

  // Load initial data only once on mount
  useEffect(() => {
    fetchActiveUsers()
    fetchActiveSessions()
    fetchSystemMetrics()
  }, [fetchActiveUsers, fetchActiveSessions, fetchSystemMetrics])

  // Set up real-time updates with proper dependencies
  useEffect(() => {
    if (state.realTimeUpdates.enabled) {
      const interval = setInterval(() => {
        syncData()
      }, state.realTimeUpdates.updateInterval)

      return () => clearInterval(interval)
    }
  }, [state.realTimeUpdates.enabled, state.realTimeUpdates.updateInterval, syncData])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    fetchActiveUsers,
    fetchActiveSessions,
    fetchSystemMetrics,
    updateUserStatus,
    updateSessionStatus,
    addGlobalNotification,
    markNotificationRead,
    broadcastEvent,
    markEventProcessed,
    setSystemHealth,
    setMaintenanceMode,
    connectDashboard,
    disconnectDashboard,
    enableRealTimeUpdates,
    disableRealTimeUpdates,
    syncData,
    getUnprocessedEvents,
    getNotificationsForUser
  }), [
    state,
    fetchActiveUsers,
    fetchActiveSessions,
    fetchSystemMetrics,
    updateUserStatus,
    updateSessionStatus,
    addGlobalNotification,
    markNotificationRead,
    broadcastEvent,
    markEventProcessed,
    setSystemHealth,
    setMaintenanceMode,
    connectDashboard,
    disconnectDashboard,
    enableRealTimeUpdates,
    disableRealTimeUpdates,
    syncData,
    getUnprocessedEvents,
    getNotificationsForUser
  ])

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  )
}

// Hook to use the context
export function useGlobalState() {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}
