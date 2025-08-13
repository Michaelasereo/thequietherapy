"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Types for dashboard state
interface UserData {
  id: string
  email: string
  full_name: string
  user_type: 'individual' | 'partner' | 'therapist' | 'admin'
  is_verified: boolean
  credits: number
  package_type: string
  is_active: boolean
}

interface DashboardStats {
  totalSessions: number
  upcomingSessions: number
  progressScore: number
  averageSessionTime: number
  totalCredits: number
  usedCredits: number
}

interface Session {
  id: string
  date: string
  time: string
  therapist: string
  topic: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  dailyRoomUrl?: string
}

// Dashboard state interface
interface DashboardState {
  // User data
  user: UserData | null
  isLoading: boolean
  error: string | null
  
  // Dashboard stats
  stats: DashboardStats
  
  // Sessions
  upcomingSessions: Session[]
  pastSessions: Session[]
  
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
      sessions: { isHovered: boolean; isLoading: boolean }
      credits: { isHovered: boolean; isLoading: boolean }
      progress: { isHovered: boolean; isLoading: boolean }
      upcoming: { isHovered: boolean; isLoading: boolean }
    }
    sessionCards: {
      [sessionId: string]: {
        isExpanded: boolean
        isHovered: boolean
        isActionMenuOpen: boolean
        isRescheduling: boolean
        isCancelling: boolean
      }
    }
    quickActionCards: {
      bookSession: { isHovered: boolean; isPressed: boolean }
      viewHistory: { isHovered: boolean; isPressed: boolean }
      manageCredits: { isHovered: boolean; isPressed: boolean }
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
type DashboardAction =
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_STATS'; payload: Partial<DashboardStats> }
  | { type: 'SET_SESSIONS'; payload: { upcoming: Session[]; past: Session[] } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: DashboardState['notifications'][0] }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  // Sidebar actions
  | { type: 'SET_SIDEBAR_HOVER'; payload: boolean }
  | { type: 'SET_ACTIVE_SIDEBAR_ITEM'; payload: string }
  | { type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION'; payload: string }
  | { type: 'UPDATE_SIDEBAR_NOTIFICATIONS'; payload: { notifications: number; messages: number } }
  // Card actions
  | { type: 'SET_STATS_CARD_STATE'; payload: { card: keyof DashboardState['cardStates']['statsCards']; state: Partial<DashboardState['cardStates']['statsCards'][keyof DashboardState['cardStates']['statsCards']]> } }
  | { type: 'SET_SESSION_CARD_STATE'; payload: { sessionId: string; state: Partial<DashboardState['cardStates']['sessionCards'][string]> } }
  | { type: 'SET_QUICK_ACTION_CARD_STATE'; payload: { card: keyof DashboardState['cardStates']['quickActionCards']; state: Partial<DashboardState['cardStates']['quickActionCards'][keyof DashboardState['cardStates']['quickActionCards']]> } }
  // Button actions
  | { type: 'SET_PRIMARY_BUTTON_STATE'; payload: { buttonId: string; state: Partial<DashboardState['buttonStates']['primaryButtons'][string]> } }
  | { type: 'SET_ICON_BUTTON_STATE'; payload: { buttonId: string; state: Partial<DashboardState['buttonStates']['iconButtons'][string]> } }
  // Icon actions
  | { type: 'SET_ICON_STATE'; payload: { iconId: string; state: Partial<DashboardState['iconStates'][string]> } }

// Initial state
const initialState: DashboardState = {
  user: null,
  isLoading: true,
  error: null,
  stats: {
    totalSessions: 0,
    upcomingSessions: 0,
    progressScore: 0,
    averageSessionTime: 0,
    totalCredits: 0,
    usedCredits: 0
  },
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
      sessions: { isHovered: false, isLoading: false },
      credits: { isHovered: false, isLoading: false },
      progress: { isHovered: false, isLoading: false },
      upcoming: { isHovered: false, isLoading: false }
    },
    sessionCards: {},
    quickActionCards: {
      bookSession: { isHovered: false, isPressed: false },
      viewHistory: { isHovered: false, isPressed: false },
      manageCredits: { isHovered: false, isPressed: false },
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
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } }
    
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
interface DashboardContextType {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  // Helper functions
  fetchUserData: () => Promise<void>
  fetchSessions: () => Promise<void>
  fetchStats: () => Promise<void>
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
  addNotification: (notification: Omit<DashboardState['notifications'][0], 'id' | 'timestamp'>) => void
  
  // Sidebar helpers
  setSidebarHover: (isHovered: boolean) => void
  setActiveSidebarItem: (item: string) => void
  toggleSidebarItemExpansion: (item: string) => void
  updateSidebarNotifications: (notifications: number, messages: number) => void
  
  // Card helpers
  setStatsCardState: (card: keyof DashboardState['cardStates']['statsCards'], state: Partial<DashboardState['cardStates']['statsCards'][keyof DashboardState['cardStates']['statsCards']]>) => void
  setSessionCardState: (sessionId: string, state: Partial<DashboardState['cardStates']['sessionCards'][string]>) => void
  setQuickActionCardState: (card: keyof DashboardState['cardStates']['quickActionCards'], state: Partial<DashboardState['cardStates']['quickActionCards'][keyof DashboardState['cardStates']['quickActionCards']]>) => void
  
  // Button helpers
  setPrimaryButtonState: (buttonId: string, state: Partial<DashboardState['buttonStates']['primaryButtons'][string]>) => void
  setIconButtonState: (buttonId: string, state: Partial<DashboardState['buttonStates']['iconButtons'][string]>) => void
  
  // Icon helpers
  setIconState: (iconId: string, state: Partial<DashboardState['iconStates'][string]>) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Provider component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Fetch user data
  const fetchUserData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Get user data from cookies or API
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('trpi_user='))
        ?.split('=')[1]
      
      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie))
          
          // Ensure we only use the expected fields and validate data types
          const sanitizedUserData = {
            id: typeof userData.id === 'string' ? userData.id : '',
            email: typeof userData.email === 'string' ? userData.email : '',
            full_name: typeof userData.full_name === 'string' ? userData.full_name : '',
            user_type: ['individual', 'therapist', 'partner', 'admin'].includes(userData.user_type) ? userData.user_type : 'individual',
            is_verified: typeof userData.is_verified === 'boolean' ? userData.is_verified : false,
            credits: typeof userData.credits === 'number' ? userData.credits : 1,
            package_type: typeof userData.package_type === 'string' ? userData.package_type : 'basic',
            is_active: typeof userData.is_active === 'boolean' ? userData.is_active : true
          }
          dispatch({ type: 'SET_USER', payload: sanitizedUserData })
        } catch (error) {
          console.error('Error parsing user data:', error)
          dispatch({ type: 'SET_ERROR', payload: 'Failed to parse user data' })
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' })
    }
  }

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.sessions) {
          const upcoming = data.sessions.filter((s: Session) => s.status === 'scheduled')
          const past = data.sessions.filter((s: Session) => s.status === 'completed')
          
          dispatch({ 
            type: 'SET_SESSIONS', 
            payload: { upcoming, past } 
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      // This would typically come from an API
      const mockStats: DashboardStats = {
        totalSessions: state.upcomingSessions.length + state.pastSessions.length,
        upcomingSessions: state.upcomingSessions.length,
        progressScore: 75,
        averageSessionTime: 50,
        totalCredits: (state.user && typeof state.user.credits === 'number') ? state.user.credits : 1,
        usedCredits: 25
      }
      
      dispatch({ type: 'UPDATE_STATS', payload: mockStats })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Helper functions
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setActiveSection = (section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }

  const addNotification = (notification: Omit<DashboardState['notifications'][0], 'id' | 'timestamp'>) => {
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
  const setStatsCardState = (card: keyof DashboardState['cardStates']['statsCards'], state: Partial<DashboardState['cardStates']['statsCards'][keyof DashboardState['cardStates']['statsCards']]>) => {
    dispatch({ type: 'SET_STATS_CARD_STATE', payload: { card, state } })
  }

  const setSessionCardState = (sessionId: string, state: Partial<DashboardState['cardStates']['sessionCards'][string]>) => {
    dispatch({ type: 'SET_SESSION_CARD_STATE', payload: { sessionId, state } })
  }

  const setQuickActionCardState = (card: keyof DashboardState['cardStates']['quickActionCards'], state: Partial<DashboardState['cardStates']['quickActionCards'][keyof DashboardState['cardStates']['quickActionCards']]>) => {
    dispatch({ type: 'SET_QUICK_ACTION_CARD_STATE', payload: { card, state } })
  }

  // Button helpers
  const setPrimaryButtonState = (buttonId: string, state: Partial<DashboardState['buttonStates']['primaryButtons'][string]>) => {
    dispatch({ type: 'SET_PRIMARY_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconButtonState = (buttonId: string, state: Partial<DashboardState['buttonStates']['iconButtons'][string]>) => {
    dispatch({ type: 'SET_ICON_BUTTON_STATE', payload: { buttonId, state } })
  }

  // Icon helpers
  const setIconState = (iconId: string, state: Partial<DashboardState['iconStates'][string]>) => {
    dispatch({ type: 'SET_ICON_STATE', payload: { iconId, state } })
  }

  // Load initial data
  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (state.user && typeof state.user === 'object' && state.user.id) {
      fetchSessions()
      fetchStats()
    }
  }, [state.user])

  const value: DashboardContextType = {
    state,
    dispatch,
    fetchUserData,
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
    setQuickActionCardState,
    setPrimaryButtonState,
    setIconButtonState,
    setIconState
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook to use dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
