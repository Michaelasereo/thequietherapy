"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Partner-specific data interfaces
export interface PartnerData {
  id: string
  full_name: string
  email: string
  company_name: string
  subscription_plan: string
  is_verified: boolean
  is_active: boolean
  total_members: number
  total_sessions: number
  monthly_budget: number
  created_at: string
  subscription_end_date: string
}

export interface PartnerMember {
  id: string
  full_name: string
  email: string
  department: string
  position: string
  status: 'active' | 'inactive' | 'pending'
  sessions_used: number
  sessions_allocated: number
  last_session_date: string
  created_at: string
}

export interface PartnerSession {
  id: string
  member_name: string
  member_email: string
  therapist_name: string
  session_type: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  cost: number
  notes?: string
}

export interface PartnerStats {
  totalMembers: number
  activeMembers: number
  totalSessions: number
  completedSessions: number
  monthlyBudget: number
  budgetUsed: number
  budgetRemaining: number
  averageSessionCost: number
  topDepartments: Array<{ department: string; sessions: number }>
  monthlyTrend: Array<{ month: string; sessions: number; cost: number }>
}

// Partner dashboard state interface
export interface PartnerDashboardState {
  // Partner data
  partner: PartnerData | null
  members: PartnerMember[]
  upcomingSessions: PartnerSession[]
  pastSessions: PartnerSession[]
  stats: PartnerStats | null
  
  // UI state
  isLoading: boolean
  activeSection: string
  sidebarCollapsed: boolean
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    read: boolean
    timestamp: string
  }>
  
  // Sidebar state
  sidebarState: {
    isHovered: boolean
    activeItem: string
    expandedItems: string[]
    notificationsCount: number
    unreadMessages: number
  }
  
  // Card states
  cardStates: {
    statsCards: {
      'total-members': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'active-members': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'total-sessions': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'budget-remaining': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
    }
    memberCards: Record<string, {
      isExpanded: boolean
      isHovered: boolean
      isActionMenuOpen: boolean
      isEditing: boolean
      isViewingHistory: boolean
      isSuspending: boolean
    }>
    sessionCards: Record<string, {
      isExpanded: boolean
      isHovered: boolean
      isActionMenuOpen: boolean
      isRescheduling: boolean
      isCancelling: boolean
      isViewingDetails: boolean
    }>
    quickActionCards: {
      'add-member': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'schedule-session': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'generate-report': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'manage-budget': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
    }
  }
  
  // Button states
  buttonStates: {
    primaryButtons: Record<string, {
      isLoading: boolean
      isDisabled: boolean
      isPressed: boolean
      variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    }>
    iconButtons: Record<string, {
      isHovered: boolean
      isPressed: boolean
      isActive: boolean
      tooltipVisible: boolean
    }>
  }
  
  // Icon states
  iconStates: Record<string, {
    isHovered: boolean
    isActive: boolean
    isAnimated: boolean
    color: string
    size: 'sm' | 'md' | 'lg'
  }>
}

// Action types
export type PartnerDashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_PARTNER_DATA'; payload: PartnerData }
  | { type: 'SET_MEMBERS'; payload: PartnerMember[] }
  | { type: 'SET_UPCOMING_SESSIONS'; payload: PartnerSession[] }
  | { type: 'SET_PAST_SESSIONS'; payload: PartnerSession[] }
  | { type: 'SET_STATS'; payload: PartnerStats }
  | { type: 'ADD_NOTIFICATION'; payload: PartnerDashboardState['notifications'][0] }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_SIDEBAR_HOVER'; payload: boolean }
  | { type: 'SET_ACTIVE_SIDEBAR_ITEM'; payload: string }
  | { type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION'; payload: string }
  | { type: 'UPDATE_SIDEBAR_NOTIFICATIONS'; payload: { notificationsCount: number; unreadMessages: number } }
  | { type: 'SET_STATS_CARD_STATE'; payload: { card: keyof PartnerDashboardState['cardStates']['statsCards']; state: Partial<PartnerDashboardState['cardStates']['statsCards'][keyof PartnerDashboardState['cardStates']['statsCards']]> } }
  | { type: 'SET_MEMBER_CARD_STATE'; payload: { memberId: string; state: Partial<PartnerDashboardState['cardStates']['memberCards'][string]> } }
  | { type: 'SET_SESSION_CARD_STATE'; payload: { sessionId: string; state: Partial<PartnerDashboardState['cardStates']['sessionCards'][string]> } }
  | { type: 'SET_QUICK_ACTION_CARD_STATE'; payload: { card: keyof PartnerDashboardState['cardStates']['quickActionCards']; state: Partial<PartnerDashboardState['cardStates']['quickActionCards'][keyof PartnerDashboardState['cardStates']['quickActionCards']]> } }
  | { type: 'SET_PRIMARY_BUTTON_STATE'; payload: { buttonId: string; state: Partial<PartnerDashboardState['buttonStates']['primaryButtons'][string]> } }
  | { type: 'SET_ICON_BUTTON_STATE'; payload: { buttonId: string; state: Partial<PartnerDashboardState['buttonStates']['iconButtons'][string]> } }
  | { type: 'SET_ICON_STATE'; payload: { iconId: string; state: Partial<PartnerDashboardState['iconStates'][string]> } }

// Initial state
const initialState: PartnerDashboardState = {
  partner: null,
  members: [],
  upcomingSessions: [],
  pastSessions: [],
  stats: null,
  isLoading: false,
  activeSection: 'overview',
  sidebarCollapsed: false,
  notifications: [],
  sidebarState: {
    isHovered: false,
    activeItem: 'overview',
    expandedItems: [],
    notificationsCount: 0,
    unreadMessages: 0
  },
  cardStates: {
    statsCards: {
      'total-members': { isLoading: false, isHovered: false, isExpanded: false },
      'active-members': { isLoading: false, isHovered: false, isExpanded: false },
      'total-sessions': { isLoading: false, isHovered: false, isExpanded: false },
      'budget-remaining': { isLoading: false, isHovered: false, isExpanded: false }
    },
    memberCards: {},
    sessionCards: {},
    quickActionCards: {
      'add-member': { isLoading: false, isHovered: false, isExpanded: false },
      'add-member': { isLoading: false, isHovered: false, isExpanded: false },
      'schedule-session': { isLoading: false, isHovered: false, isExpanded: false },
      'generate-report': { isLoading: false, isHovered: false, isExpanded: false },
      'manage-budget': { isLoading: false, isHovered: false, isExpanded: false }
    }
  },
  buttonStates: {
    primaryButtons: {},
    iconButtons: {}
  },
  iconStates: {}
}

// Reducer function
function partnerDashboardReducer(state: PartnerDashboardState, action: PartnerDashboardAction): PartnerDashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload }
    
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload }
    
    case 'SET_PARTNER_DATA':
      return { ...state, partner: action.payload }
    
    case 'SET_MEMBERS':
      return { ...state, members: action.payload }
    
    case 'SET_UPCOMING_SESSIONS':
      return { ...state, upcomingSessions: action.payload }
    
    case 'SET_PAST_SESSIONS':
      return { ...state, pastSessions: action.payload }
    
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      }
    
    case 'SET_SIDEBAR_HOVER':
      return {
        ...state,
        sidebarState: { ...state.sidebarState, isHovered: action.payload }
      }
    
    case 'SET_ACTIVE_SIDEBAR_ITEM':
      return {
        ...state,
        sidebarState: { ...state.sidebarState, activeItem: action.payload }
      }
    
    case 'TOGGLE_SIDEBAR_ITEM_EXPANSION':
      const expandedItems = state.sidebarState.expandedItems.includes(action.payload)
        ? state.sidebarState.expandedItems.filter(item => item !== action.payload)
        : [...state.sidebarState.expandedItems, action.payload]
      return {
        ...state,
        sidebarState: { ...state.sidebarState, expandedItems }
      }
    
    case 'UPDATE_SIDEBAR_NOTIFICATIONS':
      return {
        ...state,
        sidebarState: {
          ...state.sidebarState,
          notificationsCount: action.payload.notificationsCount,
          unreadMessages: action.payload.unreadMessages
        }
      }
    
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
    
    case 'SET_MEMBER_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          memberCards: {
            ...state.cardStates.memberCards,
            [action.payload.memberId]: {
              ...state.cardStates.memberCards[action.payload.memberId],
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
const PartnerDashboardContext = createContext<{
  state: PartnerDashboardState
  dispatch: React.Dispatch<PartnerDashboardAction>
  fetchPartnerData: () => Promise<void>
  fetchMembers: () => Promise<void>
  fetchSessions: () => Promise<void>
  fetchStats: () => Promise<void>
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
  addNotification: (notification: PartnerDashboardState['notifications'][0]) => void
  setSidebarHover: (isHovered: boolean) => void
  setActiveSidebarItem: (item: string) => void
  toggleSidebarItemExpansion: (item: string) => void
  updateSidebarNotifications: (notificationsCount: number, unreadMessages: number) => void
  setStatsCardState: (card: keyof PartnerDashboardState['cardStates']['statsCards'], state: Partial<PartnerDashboardState['cardStates']['statsCards'][keyof PartnerDashboardState['cardStates']['statsCards']]>) => void
  setMemberCardState: (memberId: string, state: Partial<PartnerDashboardState['cardStates']['memberCards'][string]>) => void
  setSessionCardState: (sessionId: string, state: Partial<PartnerDashboardState['cardStates']['sessionCards'][string]>) => void
  setQuickActionCardState: (card: keyof PartnerDashboardState['cardStates']['quickActionCards'], state: Partial<PartnerDashboardState['cardStates']['quickActionCards'][keyof PartnerDashboardState['cardStates']['quickActionCards']]>) => void
  setPrimaryButtonState: (buttonId: string, state: Partial<PartnerDashboardState['buttonStates']['primaryButtons'][string]>) => void
  setIconButtonState: (buttonId: string, state: Partial<PartnerDashboardState['buttonStates']['iconButtons'][string]>) => void
  setIconState: (iconId: string, state: Partial<PartnerDashboardState['iconStates'][string]>) => void
} | undefined>(undefined)

// Provider component
export function PartnerDashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(partnerDashboardReducer, initialState)

  // Data fetching functions
  const fetchPartnerData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Mock data for now - replace with actual API call
      const mockPartnerData: PartnerData = {
        id: 'partner-1',
        full_name: 'John Smith',
        email: 'john@company.com',
        company_name: 'TechCorp Inc.',
        subscription_plan: 'enterprise',
        is_verified: true,
        is_active: true,
        total_members: 24,
        total_sessions: 156,
        monthly_budget: 5000,
        created_at: '2024-01-15',
        subscription_end_date: '2025-01-15'
      }
      dispatch({ type: 'SET_PARTNER_DATA', payload: mockPartnerData })
    } catch (error) {
      console.error('Error fetching partner data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const fetchMembers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMembers: PartnerMember[] = [
        {
          id: 'member-1',
          full_name: 'Alice Johnson',
          email: 'alice@company.com',
          department: 'Engineering',
          position: 'Senior Developer',
          status: 'active',
          sessions_used: 8,
          sessions_allocated: 12,
          last_session_date: '2024-01-10',
          created_at: '2024-01-15'
        },
        {
          id: 'member-2',
          full_name: 'Bob Wilson',
          email: 'bob@company.com',
          department: 'Marketing',
          position: 'Marketing Manager',
          status: 'active',
          sessions_used: 5,
          sessions_allocated: 10,
          last_session_date: '2024-01-08',
          created_at: '2024-01-15'
        }
      ]
      dispatch({ type: 'SET_MEMBERS', payload: mockMembers })
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockUpcomingSessions: PartnerSession[] = [
        {
          id: 'session-1',
          member_name: 'Alice Johnson',
          member_email: 'alice@company.com',
          therapist_name: 'Dr. Sarah White',
          session_type: 'Stress Management',
          date: '2024-01-20',
          time: '10:00 AM',
          duration: 60,
          status: 'scheduled',
          cost: 150
        }
      ]
      const mockPastSessions: PartnerSession[] = [
        {
          id: 'session-2',
          member_name: 'Bob Wilson',
          member_email: 'bob@company.com',
          therapist_name: 'Dr. Michael Brown',
          session_type: 'Work-Life Balance',
          date: '2024-01-15',
          time: '02:00 PM',
          duration: 60,
          status: 'completed',
          cost: 150,
          notes: 'Good progress on work-life balance goals'
        }
      ]
      dispatch({ type: 'SET_UPCOMING_SESSIONS', payload: mockUpcomingSessions })
      dispatch({ type: 'SET_PAST_SESSIONS', payload: mockPastSessions })
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockStats: PartnerStats = {
        totalMembers: 24,
        activeMembers: 20,
        totalSessions: 156,
        completedSessions: 142,
        monthlyBudget: 5000,
        budgetUsed: 3200,
        budgetRemaining: 1800,
        averageSessionCost: 150,
        topDepartments: [
          { department: 'Engineering', sessions: 45 },
          { department: 'Marketing', sessions: 32 },
          { department: 'Sales', sessions: 28 }
        ],
        monthlyTrend: [
          { month: 'Jan', sessions: 12, cost: 1800 },
          { month: 'Feb', sessions: 15, cost: 2250 },
          { month: 'Mar', sessions: 18, cost: 2700 }
        ]
      }
      dispatch({ type: 'SET_STATS', payload: mockStats })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Helper functions
  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !state.sidebarCollapsed })
  }

  const setActiveSection = (section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }

  const addNotification = (notification: PartnerDashboardState['notifications'][0]) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  const setSidebarHover = (isHovered: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_HOVER', payload: isHovered })
  }

  const setActiveSidebarItem = (item: string) => {
    dispatch({ type: 'SET_ACTIVE_SIDEBAR_ITEM', payload: item })
  }

  const toggleSidebarItemExpansion = (item: string) => {
    dispatch({ type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION', payload: item })
  }

  const updateSidebarNotifications = (notificationsCount: number, unreadMessages: number) => {
    dispatch({ type: 'UPDATE_SIDEBAR_NOTIFICATIONS', payload: { notificationsCount, unreadMessages } })
  }

  const setStatsCardState = (card: keyof PartnerDashboardState['cardStates']['statsCards'], state: Partial<PartnerDashboardState['cardStates']['statsCards'][keyof PartnerDashboardState['cardStates']['statsCards']]>) => {
    dispatch({ type: 'SET_STATS_CARD_STATE', payload: { card, state } })
  }

  const setMemberCardState = (memberId: string, state: Partial<PartnerDashboardState['cardStates']['memberCards'][string]>) => {
    dispatch({ type: 'SET_MEMBER_CARD_STATE', payload: { memberId, state } })
  }

  const setSessionCardState = (sessionId: string, state: Partial<PartnerDashboardState['cardStates']['sessionCards'][string]>) => {
    dispatch({ type: 'SET_SESSION_CARD_STATE', payload: { sessionId, state } })
  }

  const setQuickActionCardState = (card: keyof PartnerDashboardState['cardStates']['quickActionCards'], state: Partial<PartnerDashboardState['cardStates']['quickActionCards'][keyof PartnerDashboardState['cardStates']['quickActionCards']]>) => {
    dispatch({ type: 'SET_QUICK_ACTION_CARD_STATE', payload: { card, state } })
  }

  const setPrimaryButtonState = (buttonId: string, state: Partial<PartnerDashboardState['buttonStates']['primaryButtons'][string]>) => {
    dispatch({ type: 'SET_PRIMARY_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconButtonState = (buttonId: string, state: Partial<PartnerDashboardState['buttonStates']['iconButtons'][string]>) => {
    dispatch({ type: 'SET_ICON_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconState = (iconId: string, state: Partial<PartnerDashboardState['iconStates'][string]>) => {
    dispatch({ type: 'SET_ICON_STATE', payload: { iconId, state } })
  }

  // Load initial data
  useEffect(() => {
    fetchPartnerData()
    fetchMembers()
    fetchSessions()
    fetchStats()
  }, [])

  const contextValue = {
    state,
    dispatch,
    fetchPartnerData,
    fetchMembers,
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
    setMemberCardState,
    setSessionCardState,
    setQuickActionCardState,
    setPrimaryButtonState,
    setIconButtonState,
    setIconState
  }

  return (
    <PartnerDashboardContext.Provider value={contextValue}>
      {children}
    </PartnerDashboardContext.Provider>
  )
}

// Hook to use the context
export function usePartnerDashboard() {
  const context = useContext(PartnerDashboardContext)
  if (context === undefined) {
    throw new Error('usePartnerDashboard must be used within a PartnerDashboardProvider')
  }
  return context
}
