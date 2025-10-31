"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

// Types for therapist dashboard state
interface TherapistData {
  id: string
  email: string
  full_name: string
  specialization: string
  license_number: string
  is_verified: boolean
  is_active: boolean
  availability_approved: boolean
  rating: number
  total_sessions: number
  total_clients: number
  hourly_rate: number
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  age: number
  gender: string
  primary_concern: string
  session_count: number
  last_session_date?: string
  next_session_date?: string
  status: 'active' | 'inactive' | 'pending'
  notes?: string
}

interface TherapistSession {
  id: string
  client_id: string
  client_name: string
  date: string
  time: string
  duration: number
  type: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  daily_room_url?: string
  notes?: string
  rating?: number
  feedback?: string
}

interface TherapistStats {
  totalClients: number
  activeClients: number
  sessionsThisMonth: number
  averageRating: number
  hoursThisWeek: number
  earningsThisMonth: number
  completionRate: number
  clientSatisfaction: number
}

interface TherapistDashboardState {
  // Therapist data
  therapist: TherapistData | null
  isLoading: boolean
  error: string | null
  
  // Dashboard stats
  stats: TherapistStats
  
  // Data
  clients: Client[]
  upcomingSessions: TherapistSession[]
  pastSessions: TherapistSession[]
  
  // UI state
  sidebarCollapsed: boolean
  activeSection: string
  
  // Sidebar Navigation State
  sidebarState: {
    isHovered: boolean
    activeItem: string
    expandedItems: string[]
    notificationsCount: number
    unreadMessages: number
  }
  
  // Card States
  cardStates: {
    statsCards: {
      clients: { isHovered: boolean; isLoading: boolean }
      sessions: { isHovered: boolean; isLoading: boolean }
      rating: { isHovered: boolean; isLoading: boolean }
      earnings: { isHovered: boolean; isLoading: boolean }
    }
    sessionCards: {
      [sessionId: string]: {
        isExpanded: boolean
        isHovered: boolean
        isActionMenuOpen: boolean
        isRescheduling: boolean
        isCancelling: boolean
        isTakingNotes: boolean
      }
    }
    clientCards: {
      [clientId: string]: {
        isExpanded: boolean
        isHovered: boolean
        isActionMenuOpen: boolean
        isEditing: boolean
        isViewingHistory: boolean
      }
    }
    quickActionCards: {
      viewSchedule: { isHovered: boolean; isPressed: boolean }
      manageClients: { isHovered: boolean; isPressed: boolean }
      viewEarnings: { isHovered: boolean; isPressed: boolean }
      settings: { isHovered: boolean; isPressed: boolean }
    }
  }
  
  // Button States
  buttonStates: {
    primaryButtons: {
      [buttonId: string]: {
        isLoading: boolean
        isDisabled: boolean
        isPressed: boolean
        variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
      }
    }
    iconButtons: {
      [buttonId: string]: {
        isHovered: boolean
        isPressed: boolean
        isActive: boolean
        tooltipVisible: boolean
      }
    }
  }
  
  // Icon States
  iconStates: {
    [iconId: string]: {
      isHovered: boolean
      isActive: boolean
      isAnimated: boolean
      color: string
      size: 'sm' | 'md' | 'lg'
    }
  }
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    read: boolean
    timestamp: string
  }>
}

// Action types
type TherapistDashboardAction =
  | { type: 'SET_THERAPIST'; payload: TherapistData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'REFETCH_THERAPIST_DATA' }
  | { type: 'UPDATE_STATS'; payload: Partial<TherapistStats> }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_SESSIONS'; payload: { upcoming: TherapistSession[]; past: TherapistSession[] } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: TherapistDashboardState['notifications'][0] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  // Sidebar actions
  | { type: 'SET_SIDEBAR_HOVER'; payload: boolean }
  | { type: 'SET_ACTIVE_SIDEBAR_ITEM'; payload: string }
  | { type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION'; payload: string }
  | { type: 'UPDATE_SIDEBAR_NOTIFICATIONS'; payload: { notifications: number; messages: number } }
  // Card actions
  | { type: 'SET_STATS_CARD_STATE'; payload: { card: keyof TherapistDashboardState['cardStates']['statsCards']; state: Partial<TherapistDashboardState['cardStates']['statsCards'][keyof TherapistDashboardState['cardStates']['statsCards']]> } }
  | { type: 'SET_SESSION_CARD_STATE'; payload: { sessionId: string; state: Partial<TherapistDashboardState['cardStates']['sessionCards'][string]> } }
  | { type: 'SET_CLIENT_CARD_STATE'; payload: { clientId: string; state: Partial<TherapistDashboardState['cardStates']['clientCards'][string]> } }
  | { type: 'SET_QUICK_ACTION_CARD_STATE'; payload: { card: keyof TherapistDashboardState['cardStates']['quickActionCards']; state: Partial<TherapistDashboardState['cardStates']['quickActionCards'][keyof TherapistDashboardState['cardStates']['quickActionCards']]> } }
  // Button actions
  | { type: 'SET_PRIMARY_BUTTON_STATE'; payload: { buttonId: string; state: Partial<TherapistDashboardState['buttonStates']['primaryButtons'][string]> } }
  | { type: 'SET_ICON_BUTTON_STATE'; payload: { buttonId: string; state: Partial<TherapistDashboardState['buttonStates']['iconButtons'][string]> } }
  // Icon actions
  | { type: 'SET_ICON_STATE'; payload: { iconId: string; state: Partial<TherapistDashboardState['iconStates'][string]> } }

// Initial state
const initialState: TherapistDashboardState = {
  therapist: null,
  isLoading: true,
  error: null,
  stats: {
    totalClients: 0,
    activeClients: 0,
    sessionsThisMonth: 0,
    averageRating: 0,
    hoursThisWeek: 0,
    earningsThisMonth: 0,
    completionRate: 0,
    clientSatisfaction: 0
  },
  clients: [],
  upcomingSessions: [],
  pastSessions: [],
  sidebarCollapsed: false,
  activeSection: 'overview',
  sidebarState: {
    isHovered: false,
    activeItem: 'overview',
    expandedItems: [],
    notificationsCount: 0,
    unreadMessages: 0
  },
  cardStates: {
    statsCards: {
      clients: { isHovered: false, isLoading: false },
      sessions: { isHovered: false, isLoading: false },
      rating: { isHovered: false, isLoading: false },
      earnings: { isHovered: false, isLoading: false }
    },
    sessionCards: {},
    clientCards: {},
    quickActionCards: {
      viewSchedule: { isHovered: false, isPressed: false },
      manageClients: { isHovered: false, isPressed: false },
      viewEarnings: { isHovered: false, isPressed: false },
      settings: { isHovered: false, isPressed: false }
    }
  },
  buttonStates: {
    primaryButtons: {},
    iconButtons: {}
  },
  iconStates: {},
  notifications: []
}

// Reducer function
function therapistDashboardReducer(state: TherapistDashboardState, action: TherapistDashboardAction): TherapistDashboardState {
  switch (action.type) {
    case 'SET_THERAPIST':
      return { ...state, therapist: action.payload, isLoading: false }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'REFETCH_THERAPIST_DATA':
      return { ...state, isLoading: true }
    
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } }
    
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload }
    
    case 'SET_SESSIONS':
      return { 
        ...state, 
        upcomingSessions: action.payload.upcoming,
        pastSessions: action.payload.past
      }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload }
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications]
      }
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }
    
    // Sidebar cases
    case 'SET_SIDEBAR_HOVER':
      return { ...state, sidebarState: { ...state.sidebarState, isHovered: action.payload } }
    
    case 'SET_ACTIVE_SIDEBAR_ITEM':
      return { ...state, sidebarState: { ...state.sidebarState, activeItem: action.payload } }
    
    case 'TOGGLE_SIDEBAR_ITEM_EXPANSION':
      const expandedItems = state.sidebarState.expandedItems.includes(action.payload)
        ? state.sidebarState.expandedItems.filter(item => item !== action.payload)
        : [...state.sidebarState.expandedItems, action.payload]
      return { ...state, sidebarState: { ...state.sidebarState, expandedItems } }
    
    case 'UPDATE_SIDEBAR_NOTIFICATIONS':
      return { 
        ...state, 
        sidebarState: { 
          ...state.sidebarState, 
          notificationsCount: action.payload.notifications,
          unreadMessages: action.payload.messages
        } 
      }
    
    // Card cases
    case 'SET_STATS_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          statsCards: {
            ...state.cardStates.statsCards,
            [action.payload.card]: {
              ...state.cardStates.statsCards[action.payload.card],
              ...action.payload.state
            }
          }
        }
      }
    
    case 'SET_SESSION_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          sessionCards: {
            ...state.cardStates.sessionCards,
            [action.payload.sessionId]: {
              ...state.cardStates.sessionCards[action.payload.sessionId],
              ...action.payload.state
            }
          }
        }
      }
    
    case 'SET_CLIENT_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          clientCards: {
            ...state.cardStates.clientCards,
            [action.payload.clientId]: {
              ...state.cardStates.clientCards[action.payload.clientId],
              ...action.payload.state
            }
          }
        }
      }
    
    case 'SET_QUICK_ACTION_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          quickActionCards: {
            ...state.cardStates.quickActionCards,
            [action.payload.card]: {
              ...state.cardStates.quickActionCards[action.payload.card],
              ...action.payload.state
            }
          }
        }
      }
    
    // Button cases
    case 'SET_PRIMARY_BUTTON_STATE':
      return {
        ...state,
        buttonStates: {
          ...state.buttonStates,
          primaryButtons: {
            ...state.buttonStates.primaryButtons,
            [action.payload.buttonId]: {
              ...state.buttonStates.primaryButtons[action.payload.buttonId],
              ...action.payload.state
            }
          }
        }
      }
    
    case 'SET_ICON_BUTTON_STATE':
      return {
        ...state,
        buttonStates: {
          ...state.buttonStates,
          iconButtons: {
            ...state.buttonStates.iconButtons,
            [action.payload.buttonId]: {
              ...state.buttonStates.iconButtons[action.payload.buttonId],
              ...action.payload.state
            }
          }
        }
      }
    
    // Icon cases
    case 'SET_ICON_STATE':
      return {
        ...state,
        iconStates: {
          ...state.iconStates,
          [action.payload.iconId]: {
            ...state.iconStates[action.payload.iconId],
            ...action.payload.state
          }
        }
      }
    
    default:
      return state
  }
}

// Context
interface TherapistDashboardContextType {
  state: TherapistDashboardState
  dispatch: React.Dispatch<TherapistDashboardAction>
  // Helper functions
  fetchTherapistData: () => Promise<void>
  refetchTherapistData: () => Promise<void>
  fetchClients: () => Promise<void>
  fetchSessions: () => Promise<void>
  fetchStats: () => Promise<void>
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
  addNotification: (notification: Omit<TherapistDashboardState['notifications'][0], 'id' | 'timestamp'>) => void
  
  // Sidebar helpers
  setSidebarHover: (isHovered: boolean) => void
  setActiveSidebarItem: (item: string) => void
  toggleSidebarItemExpansion: (item: string) => void
  updateSidebarNotifications: (notifications: number, messages: number) => void
  
  // Card helpers
  setStatsCardState: (card: keyof TherapistDashboardState['cardStates']['statsCards'], state: Partial<TherapistDashboardState['cardStates']['statsCards'][keyof TherapistDashboardState['cardStates']['statsCards']]>) => void
  setSessionCardState: (sessionId: string, state: Partial<TherapistDashboardState['cardStates']['sessionCards'][string]>) => void
  setClientCardState: (clientId: string, state: Partial<TherapistDashboardState['cardStates']['clientCards'][string]>) => void
  setQuickActionCardState: (card: keyof TherapistDashboardState['cardStates']['quickActionCards'], state: Partial<TherapistDashboardState['cardStates']['quickActionCards'][keyof TherapistDashboardState['cardStates']['quickActionCards']]>) => void
  
  // Button helpers
  setPrimaryButtonState: (buttonId: string, state: Partial<TherapistDashboardState['buttonStates']['primaryButtons'][string]>) => void
  setIconButtonState: (buttonId: string, state: Partial<TherapistDashboardState['buttonStates']['iconButtons'][string]>) => void
  
  // Icon helpers
  setIconState: (iconId: string, state: Partial<TherapistDashboardState['iconStates'][string]>) => void
}

const TherapistDashboardContext = createContext<TherapistDashboardContextType | undefined>(undefined)

// Provider component
export function TherapistDashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(therapistDashboardReducer, initialState)
  

  // Fetch therapist data
  const fetchTherapistData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Fetch therapist data from API with cache busting
      const response = await fetch('/api/therapist/profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // The API returns {success: true, data: {therapist: ...}}
        const therapistData = data.data?.therapist || data.therapist
        
        if (data.success && therapistData) {
          dispatch({ type: 'SET_THERAPIST', payload: therapistData })
        } else {
          dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to load therapist data' })
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load therapist data' })
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load therapist data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Auto-fetch therapist data on mount
  useEffect(() => {
    fetchTherapistData()
  }, [fetchTherapistData])

  // Refetch therapist data (for cache invalidation)
  const refetchTherapistData = useCallback(async () => {
    console.log('🔄 Context: Manually refetching therapist data...')
    try {
      dispatch({ type: 'REFETCH_THERAPIST_DATA' })
      
      // Re-use the same logic as fetchTherapistData but with explicit cache busting
      const response = await fetch('/api/therapist/profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.therapist) {
          console.log('🔄 Context: Refetched data:', data.therapist)
          console.log('🔄 Context: availability_approved value:', data.therapist.availability_approved)
          dispatch({ type: 'SET_THERAPIST', payload: data.therapist })
        } else {
          console.error('🔄 Context: Failed to refetch - invalid response:', data)
          dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to refetch therapist data' })
        }
      } else {
        console.error('🔄 Context: Failed to refetch - HTTP error:', response.status)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refetch therapist data' })
      }
    } catch (error) {
      console.error('🔄 Context: Failed to refetch therapist data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refetch therapist data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!state.therapist?.id) {
      console.log('🔍 No therapist ID available for fetching clients')
      return
    }

    try {
      const response = await fetch(`/api/therapist/clients?therapistId=${state.therapist.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.clients) {
          dispatch({ type: 'SET_CLIENTS', payload: data.clients })
        }
      } else {
        console.error('Failed to fetch clients:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }, [dispatch, state.therapist?.id])

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/therapist/sessions')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.sessions) {
          const upcoming = data.sessions.filter((s: TherapistSession) => s.status === 'scheduled')
          const past = data.sessions.filter((s: TherapistSession) => s.status === 'completed')
          
          dispatch({ 
            type: 'SET_SESSIONS', 
            payload: { upcoming, past } 
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }, [dispatch])

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      // This would typically come from an API
      const mockStats: TherapistStats = {
        totalClients: state.clients.length,
        activeClients: state.clients.filter(c => c.status === 'active').length,
        sessionsThisMonth: state.upcomingSessions.length + state.pastSessions.length,
        averageRating: state.therapist?.rating || 4.8,
        hoursThisWeek: 12,
        earningsThisMonth: 2400,
        completionRate: 95,
        clientSatisfaction: 92
      }
      
      dispatch({ type: 'UPDATE_STATS', payload: mockStats })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [dispatch, state.clients, state.upcomingSessions.length, state.pastSessions.length, state.therapist?.rating])

  // Helper functions
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setActiveSection = (section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }

  const addNotification = (notification: Omit<TherapistDashboardState['notifications'][0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })
  }

  // Sidebar helpers
  const setSidebarHover = (isHovered: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_HOVER', payload: isHovered })
  }

  const setActiveSidebarItem = (item: string) => {
    dispatch({ type: 'SET_ACTIVE_SIDEBAR_ITEM', payload: item })
  }

  const toggleSidebarItemExpansion = (item: string) => {
    dispatch({ type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION', payload: item })
  }

  const updateSidebarNotifications = (notifications: number, messages: number) => {
    dispatch({ type: 'UPDATE_SIDEBAR_NOTIFICATIONS', payload: { notifications, messages } })
  }

  // Card helpers
  const setStatsCardState = (card: keyof TherapistDashboardState['cardStates']['statsCards'], state: Partial<TherapistDashboardState['cardStates']['statsCards'][keyof TherapistDashboardState['cardStates']['statsCards']]>) => {
    dispatch({ type: 'SET_STATS_CARD_STATE', payload: { card, state } })
  }

  const setSessionCardState = (sessionId: string, state: Partial<TherapistDashboardState['cardStates']['sessionCards'][string]>) => {
    dispatch({ type: 'SET_SESSION_CARD_STATE', payload: { sessionId, state } })
  }

  const setClientCardState = (clientId: string, state: Partial<TherapistDashboardState['cardStates']['clientCards'][string]>) => {
    dispatch({ type: 'SET_CLIENT_CARD_STATE', payload: { clientId, state } })
  }

  const setQuickActionCardState = (card: keyof TherapistDashboardState['cardStates']['quickActionCards'], state: Partial<TherapistDashboardState['cardStates']['quickActionCards'][keyof TherapistDashboardState['cardStates']['quickActionCards']]>) => {
    dispatch({ type: 'SET_QUICK_ACTION_CARD_STATE', payload: { card, state } })
  }

  // Button helpers
  const setPrimaryButtonState = (buttonId: string, state: Partial<TherapistDashboardState['buttonStates']['primaryButtons'][string]>) => {
    dispatch({ type: 'SET_PRIMARY_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconButtonState = (buttonId: string, state: Partial<TherapistDashboardState['buttonStates']['iconButtons'][string]>) => {
    dispatch({ type: 'SET_ICON_BUTTON_STATE', payload: { buttonId, state } })
  }

  // Icon helpers
  const setIconState = (iconId: string, state: Partial<TherapistDashboardState['iconStates'][string]>) => {
    dispatch({ type: 'SET_ICON_STATE', payload: { iconId, state } })
  }

  // Load initial data
  useEffect(() => {
    fetchTherapistData()
  }, [])

  // Listen for global refresh events
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Context: Received global refresh event')
      refetchTherapistData()
    }

    // Listen for custom events
    window.addEventListener('therapist-data-refresh', handleGlobalRefresh)
    
    return () => {
      window.removeEventListener('therapist-data-refresh', handleGlobalRefresh)
    }
  }, [refetchTherapistData])

  // Auto-fetch therapist data on mount
  useEffect(() => {
    console.log('🔍 Context: Auto-fetching therapist data on mount')
    fetchTherapistData()
  }, [fetchTherapistData])

  useEffect(() => {
    if (state.therapist) {
      fetchClients()
      fetchSessions()
      fetchStats()
    }
  }, [state.therapist])

  const value: TherapistDashboardContextType = {
    state,
    dispatch,
    fetchTherapistData,
    refetchTherapistData,
    fetchClients,
    fetchSessions,
    fetchStats,
    toggleSidebar,
    setActiveSection,
    addNotification,
    setSidebarHover,
    setActiveSidebarItem,
    toggleSidebarItemExpansion,
    updateSidebarNotifications,
    setStatsCardState,
    setSessionCardState,
    setClientCardState,
    setQuickActionCardState,
    setPrimaryButtonState,
    setIconButtonState,
    setIconState
  }

  return (
    <TherapistDashboardContext.Provider value={value}>
      {children}
    </TherapistDashboardContext.Provider>
  )
}

// Hook to use therapist dashboard context
export function useTherapistDashboard() {
  const context = useContext(TherapistDashboardContext)
  if (context === undefined) {
    throw new Error('useTherapistDashboard must be used within a TherapistDashboardProvider')
  }
  return context
}
