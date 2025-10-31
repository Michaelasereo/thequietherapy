"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

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
  refreshCredits: () => Promise<void>
  refreshStats: () => Promise<void>
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

  // Fetch user data from the session API
  const fetchUserData = async () => {
    try {
      console.log('🔍 DashboardContext: fetchUserData called')
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Get user data from the session API (JWT-based auth)
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      console.log('🔍 DashboardContext: Session API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.user) {
          const userData = data.user
          
          // Fetch fresh credits from API
          let freshCredits = 1 // Default fallback
          console.log('🔍 DashboardContext: Fetching fresh credits from API...')
          try {
            const creditsResponse = await fetch('/api/user/credits', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache'
              }
            })
            if (creditsResponse.ok) {
              const creditsData = await creditsResponse.json()
              if (creditsData.success && creditsData.credits) {
                freshCredits = creditsData.credits.balance || 1
              }
            }
          } catch (creditsError) {
            console.error('Error fetching fresh credits:', creditsError)
          }
          
          // Ensure we only use the expected fields and validate data types
          const sanitizedUserData = {
            id: typeof userData.id === 'string' ? userData.id : '',
            email: typeof userData.email === 'string' ? userData.email : '',
            full_name: typeof userData.full_name === 'string' ? userData.full_name : (typeof userData.name === 'string' ? userData.name : ''),
            user_type: ['individual', 'therapist', 'partner', 'admin'].includes(userData.user_type) ? userData.user_type : 'individual',
            is_verified: typeof userData.is_verified === 'boolean' ? userData.is_verified : false,
            credits: freshCredits, // Use fresh credits from API
            package_type: typeof userData.package_type === 'string' ? userData.package_type : 'basic',
            is_active: typeof userData.is_active === 'boolean' ? userData.is_active : true
          }
          dispatch({ type: 'SET_USER', payload: sanitizedUserData })
        } else {
          console.error('🔍 DashboardContext: Invalid session response')
          dispatch({ type: 'SET_ERROR', payload: 'Invalid session data' })
        }
      } else {
        console.error('🔍 DashboardContext: Session API failed with status:', response.status)
        dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' })
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' })
    } finally {
      // Always set loading to false, even if there are errors
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Fetch sessions with proper error handling and data validation
  const fetchSessions = useCallback(async () => {
    try {
      if (!state.user?.id) {
        console.log('🔍 DashboardContext: No user ID, skipping session fetch')
        return
      }
      
      console.log('🔍 DashboardContext: Fetching sessions for user:', state.user.id)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      try {
        const response = await fetch(`/api/sessions?user_id=${state.user.id}&order=scheduled_date.desc`, {
          signal: controller.signal,
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.sessions && Array.isArray(data.sessions)) {
            // Validate and transform session data structure
            const validatedSessions = data.sessions
              .filter((session: any) => 
                session.id && 
                session.status && 
                (session.scheduled_date || session.start_time)
              )
              .map((session: any) => ({
                id: session.id,
                date: session.scheduled_date || session.start_time?.split('T')[0] || new Date().toISOString().split('T')[0],
                time: session.scheduled_time || session.start_time?.split('T')[1]?.substring(0, 5) || '00:00',
                // Handle therapist - could be string or object with full_name
                therapist: typeof session.therapist === 'string' 
                  ? session.therapist 
                  : session.therapist?.full_name || session.therapist_name || 'Therapist',
                topic: typeof session.topic === 'string'
                  ? session.topic
                  : session.title || session.session_type || 'Therapy Session',
                status: session.status,
                dailyRoomUrl: session.daily_room_url || session.session_url
              }))
            
            // Properly categorize sessions by status and time
            const now = new Date()
            const upcoming = validatedSessions.filter((session: any) => {
              // Use session's start_time if available, otherwise construct from date and time
              let sessionDateTime: Date
              if (session.date && session.time) {
                // Construct datetime from date and time
                const [hours, minutes] = session.time.split(':')
                sessionDateTime = new Date(session.date)
                sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
              } else {
                sessionDateTime = now // Fallback to now if no date/time
              }
              // Compute an estimated end time; default to 60 minutes if unknown
              const durationMinutes = Number(session.duration_minutes || session.duration || 60)
              const sessionEndTime = new Date(sessionDateTime.getTime() + durationMinutes * 60 * 1000)
              
              console.log('🔍 Session datetime comparison:', {
                sessionId: session.id,
                sessionDate: session.date,
                sessionTime: session.time,
                sessionDateTime: sessionDateTime.toISOString(),
                now: now.toISOString(),
                isUpcoming: sessionDateTime >= now,
                status: session.status
              })
              // Show scheduled sessions in the future
              if (session.status === 'scheduled') {
                return sessionDateTime >= now
              }
              // Also show in-progress sessions until their end time so late users can still join
              if (session.status === 'in_progress') {
                return sessionEndTime > now
              }
              return false
            })
            
            const past = validatedSessions.filter((session: any) => 
              session.status === 'completed' || 
              session.status === 'cancelled' || 
              session.status === 'no_show'
            )
            
            console.log('🔍 DashboardContext: Categorized sessions:', { 
              upcoming: upcoming.length, 
              past: past.length,
              total: validatedSessions.length 
            })
            
            console.log('🔍 DashboardContext: Upcoming sessions details:', upcoming.map((s: any) => ({
              id: s.id,
              date: s.date,
              time: s.time,
              status: s.status,
              therapist: s.therapist
            })))
            
            dispatch({ 
              type: 'SET_SESSIONS', 
              payload: { upcoming, past } 
            })
          } else {
            console.warn('🔍 DashboardContext: Invalid sessions data structure:', data)
            dispatch({ 
              type: 'SET_SESSIONS', 
              payload: { upcoming: [], past: [] } 
            })
          }
        } else {
          console.error('🔍 DashboardContext: Sessions API error:', response.status, response.statusText)
          // Set empty arrays on API error - NOT mock data
          dispatch({ 
            type: 'SET_SESSIONS', 
            payload: { upcoming: [], past: [] } 
          })
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error('🔍 DashboardContext: Sessions API fetch failed:', fetchError)
        // Set empty arrays on network error - NOT mock data
        dispatch({ 
          type: 'SET_SESSIONS', 
          payload: { upcoming: [], past: [] } 
        })
      }
    } catch (error) {
      console.error('🔍 DashboardContext: Failed to fetch sessions:', error)
      // Set empty arrays on general error - NOT mock data
      dispatch({ 
        type: 'SET_SESSIONS', 
        payload: { upcoming: [], past: [] } 
      })
    }
  }, [state.user?.id])

  // Fetch dashboard stats with real data calculation
  const fetchStats = useCallback(async () => {
    try {
      if (!state.user?.id) {
        console.log('🔍 DashboardContext: No user ID, setting zero stats')
        // If no user, use zero stats - NOT mock data
        const zeroStats: DashboardStats = {
          totalSessions: 0,
          upcomingSessions: 0,
          progressScore: 0,
          averageSessionTime: 0,
          totalCredits: 0,
          usedCredits: 0
        }
        dispatch({ type: 'UPDATE_STATS', payload: zeroStats })
        return
      }
      
      console.log('🔍 DashboardContext: Fetching real dashboard stats from API...')
      
      // Fetch stats from the dedicated API endpoint that queries the database
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data) {
          const apiStats = data.data
          const realStats: DashboardStats = {
            totalSessions: apiStats.totalSessions || 0,
            upcomingSessions: apiStats.upcomingSessions || 0,
            progressScore: apiStats.progressScore || 0,
            averageSessionTime: apiStats.averageSessionTime || 0,
            totalCredits: apiStats.totalCredits || 0,
            usedCredits: apiStats.usedCredits || 0
          }
          
          dispatch({ type: 'UPDATE_STATS', payload: realStats })
          
          // Also fetch sessions if we haven't loaded them yet
          if (state.upcomingSessions.length === 0 && state.pastSessions.length === 0 && apiStats.totalSessions > 0) {
            console.log('🔍 DashboardContext: Stats show sessions exist, fetching session details...')
            fetchSessions()
          }
          return // Success - exit early
        }
      }
      
      // If API fails, fallback to calculating from local state
      console.warn('🔍 DashboardContext: API failed, calculating from local state as fallback')
      const totalSessions = state.upcomingSessions.length + state.pastSessions.length
      const upcomingSessions = state.upcomingSessions.length
      const completedSessions = state.pastSessions.filter(s => s.status === 'completed').length
      const progressScore = Math.min(100, Math.max(0, completedSessions * 10))
      
      // Get fresh credits from API - use same endpoint as header
      let totalCredits = 0
      try {
        const creditsResponse = await fetch('/api/user/credits', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          if (creditsData.success && creditsData.credits) {
            totalCredits = creditsData.credits.balance || 0
          }
        }
      } catch (creditsError) {
        console.warn('🔍 DashboardContext: Failed to fetch credits:', creditsError)
      }
      
      const realStats: DashboardStats = {
        totalSessions,
        upcomingSessions,
        progressScore,
        averageSessionTime: completedSessions > 0 ? 50 : 0, // Default 50min if we have sessions
        totalCredits,
        usedCredits: Math.max(0, completedSessions)
      }
      
      dispatch({ type: 'UPDATE_STATS', payload: realStats })
      
    } catch (error) {
      console.error('🔍 DashboardContext: Failed to calculate stats:', error)
      // Use zero stats on error - NOT mock data
      const errorStats: DashboardStats = {
        totalSessions: 0,
        upcomingSessions: 0,
        progressScore: 0,
        averageSessionTime: 0,
        totalCredits: 0,
        usedCredits: 0
      }
      dispatch({ type: 'UPDATE_STATS', payload: errorStats })
    }
  }, [state.user?.id])

  // Refresh credits from API
  const refreshCredits = useCallback(async () => {
    try {
      const creditsResponse = await fetch('/api/user/credits', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        if (creditsData.success && creditsData.credits && state.user) {
          const freshCredits = creditsData.credits.balance || 1
          console.log('🔍 Credits refreshed:', freshCredits)
          
          // Update user credits in state
          const updatedUser = { ...state.user, credits: freshCredits }
          dispatch({ type: 'SET_USER', payload: updatedUser })
          
          // Update stats as well
          dispatch({ type: 'UPDATE_STATS', payload: { totalCredits: freshCredits } })
        }
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error)
    }
  }, [state.user])

  // Refresh stats from API
  const refreshStats = useCallback(async () => {
    console.log('🔍 DashboardContext: Manual refresh stats called')
    await fetchStats()
  }, [fetchStats])

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
    console.log('🔍 DashboardContext: useEffect called - fetching user data')
    fetchUserData()
  }, [])

  useEffect(() => {
    if (state.user && typeof state.user === 'object' && state.user.id) {
      console.log('🔍 DashboardContext: User loaded, fetching sessions and stats for:', state.user.id)
      // Only fetch if we don't have data yet to prevent infinite loops
      if (state.upcomingSessions.length === 0 && state.pastSessions.length === 0) {
        fetchSessions()
      }
      if (state.stats.totalSessions === 0) {
        fetchStats()
      }
    }
  }, [state.user?.id]) // Only depend on user ID, not the entire user object

  // Listen for booking completion events to refresh sessions
  useEffect(() => {
    const handleBookingCompleted = () => {
      console.log('🔄 DashboardContext: Booking completed, refreshing sessions...')
      fetchSessions()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('bookingCompleted', handleBookingCompleted)
      return () => window.removeEventListener('bookingCompleted', handleBookingCompleted)
    }
  }, [fetchSessions])

  const value: DashboardContextType = {
    state,
    dispatch,
    fetchUserData,
    fetchSessions,
    fetchStats,
    refreshCredits,
    refreshStats,
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
