"use client"

import { useEffect, useCallback } from 'react'
import { useDashboard } from '@/context/dashboard-context'

// Storage keys
const STORAGE_KEYS = {
  DASHBOARD_STATE: 'quiet_dashboard_state',
  USER_PREFERENCES: 'quiet_user_preferences',
  SIDEBAR_STATE: 'quiet_sidebar_state',
  NOTIFICATIONS: 'quiet_notifications',
  SESSION_CACHE: 'quiet_session_cache'
} as const

// User preferences interface
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  notificationsEnabled: boolean
  autoRefresh: boolean
  refreshInterval: number
  language: string
}

// Hook for dashboard state persistence
export function useDashboardPersistence() {
  const { state, dispatch } = useDashboard()

  // Save state to localStorage
  const saveState = useCallback((key: keyof typeof STORAGE_KEYS, data: any) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data))
      }
    } catch (error) {
      console.error(`Failed to save state to localStorage (${key}):`, error)
    }
  }, [])

  // Load state from localStorage
  const loadState = useCallback((key: keyof typeof STORAGE_KEYS) => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS[key])
        return stored ? JSON.parse(stored) : null
      }
    } catch (error) {
      console.error(`Failed to load state from localStorage (${key}):`, error)
    }
    return null
  }, [])

  // Save user preferences
  const saveUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    const current = loadState('USER_PREFERENCES') || {}
    const updated = { ...current, ...preferences }
    saveState('USER_PREFERENCES', updated)
  }, [saveState, loadState])

  // Load user preferences
  const loadUserPreferences = useCallback((): UserPreferences => {
    const stored = loadState('USER_PREFERENCES')
    return stored || {
      theme: 'system',
      sidebarCollapsed: false,
      notificationsEnabled: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      language: 'en'
    }
  }, [loadState])

  // Save sidebar state
  const saveSidebarState = useCallback(() => {
    const sidebarState = {
      collapsed: state.sidebarCollapsed,
      activeItem: state.sidebarState.activeItem,
      expandedItems: state.sidebarState.expandedItems
    }
    saveState('SIDEBAR_STATE', sidebarState)
  }, [state.sidebarCollapsed, state.sidebarState, saveState])

  // Load sidebar state
  const loadSidebarState = useCallback(() => {
    const stored = loadState('SIDEBAR_STATE')
    if (stored) {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: stored.activeItem })
      // Note: Sidebar collapsed state is handled by the sidebar component
      stored.expandedItems?.forEach((item: string) => {
        dispatch({ type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION', payload: item })
      })
    }
  }, [dispatch, loadState])

  // Save notifications
  const saveNotifications = useCallback(() => {
    saveState('NOTIFICATIONS', state.notifications)
  }, [state.notifications, saveState])

  // Load notifications
  const loadNotifications = useCallback(() => {
    const stored = loadState('NOTIFICATIONS')
    if (stored && Array.isArray(stored)) {
      stored.forEach(notification => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
      })
    }
  }, [dispatch, loadState])

  // Save session cache
  const saveSessionCache = useCallback(() => {
    const sessionData = {
      upcomingSessions: state.upcomingSessions,
      pastSessions: state.pastSessions,
      lastUpdated: Date.now()
    }
    saveState('SESSION_CACHE', sessionData)
  }, [state.upcomingSessions, state.pastSessions, saveState])

  // Load session cache
  const loadSessionCache = useCallback(() => {
    const stored = loadState('SESSION_CACHE')
    if (stored && stored.lastUpdated) {
      const cacheAge = Date.now() - stored.lastUpdated
      const maxAge = 5 * 60 * 1000 // 5 minutes
      
      if (cacheAge < maxAge) {
        dispatch({ 
          type: 'SET_SESSIONS', 
          payload: { 
            upcoming: stored.upcomingSessions || [], 
            past: stored.pastSessions || [] 
          } 
        })
        return true
      }
    }
    return false
  }, [dispatch, loadState])

  // Auto-save state changes
  useEffect(() => {
    saveSidebarState()
  }, [state.sidebarCollapsed, state.sidebarState.activeItem, state.sidebarState.expandedItems, saveSidebarState])

  useEffect(() => {
    saveNotifications()
  }, [state.notifications, saveNotifications])

  useEffect(() => {
    saveSessionCache()
  }, [state.upcomingSessions, state.pastSessions, saveSessionCache])

  // Load state on mount
  useEffect(() => {
    loadSidebarState()
    loadNotifications()
    const cacheLoaded = loadSessionCache()
    
    if (!cacheLoaded) {
      // If no cache or cache is stale, trigger fresh data fetch
      // This will be handled by the dashboard context
    }
  }, [loadSidebarState, loadNotifications, loadSessionCache])

  return {
    saveState,
    loadState,
    saveUserPreferences,
    loadUserPreferences,
    saveSidebarState,
    loadSidebarState,
    saveNotifications,
    loadNotifications,
    saveSessionCache,
    loadSessionCache
  }
}

// Hook for real-time synchronization
export function useDashboardSync() {
  const { state, dispatch } = useDashboard()

  // Sync with other tabs/windows
  const syncWithOtherTabs = useCallback((event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.DASHBOARD_STATE && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue)
        // Apply relevant state updates
        if (newState.sidebarState) {
          dispatch({ type: 'SET_ACTIVE_SIDEBAR_ITEM', payload: newState.sidebarState.activeItem })
        }
        if (newState.notifications) {
          // Merge notifications
          newState.notifications.forEach((notification: any) => {
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
          })
        }
      } catch (error) {
        console.error('Failed to sync state from other tab:', error)
      }
    }
  }, [dispatch])

  // Listen for storage events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', syncWithOtherTabs)
      return () => window.removeEventListener('storage', syncWithOtherTabs)
    }
  }, [syncWithOtherTabs])

  // Broadcast state changes to other tabs
  const broadcastStateChange = useCallback((change: any) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATE, JSON.stringify({
          ...state,
          ...change,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Failed to broadcast state change:', error)
    }
  }, [state])

  return {
    broadcastStateChange
  }
}

// Hook for performance monitoring
export function useDashboardPerformance() {
  const { state } = useDashboard()

  // Monitor state changes for performance
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (duration > 16) { // Longer than one frame (16ms)
          console.warn(`Dashboard state update took ${duration.toFixed(2)}ms`)
        }
      }
    }
  }, [state])

  // Monitor memory usage
  const getMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  }, [])

  // Monitor component re-renders
  const logRender = useCallback((componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered at ${Date.now()}`)
    }
  }, [])

  return {
    getMemoryUsage,
    logRender
  }
}
