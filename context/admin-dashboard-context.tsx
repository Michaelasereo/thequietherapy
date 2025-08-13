"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Admin-specific data interfaces
export interface AdminData {
  id: string
  full_name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  is_active: boolean
  last_login: string
  created_at: string
}

export interface SystemUser {
  id: string
  full_name: string
  email: string
  user_type: 'user' | 'therapist' | 'partner' | 'admin'
  is_verified: boolean
  is_active: boolean
  created_at: string
  last_login: string
  status: 'active' | 'suspended' | 'pending' | 'banned'
  subscription_plan?: string
  total_sessions?: number
  total_earnings?: number
}

export interface SystemStats {
  totalUsers: number
  totalTherapists: number
  totalPartners: number
  totalSessions: number
  totalRevenue: number
  activeUsers: number
  pendingVerifications: number
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
  uptime: number
  averageResponseTime: number
  monthlyGrowth: {
    users: number
    revenue: number
    sessions: number
  }
  topPerformingTherapists: Array<{
    id: string
    name: string
    sessions: number
    rating: number
    earnings: number
  }>
  recentActivity: Array<{
    id: string
    type: 'user_registration' | 'session_completed' | 'payment_received' | 'system_alert'
    description: string
    timestamp: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

export interface SystemSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  maxSessionsPerUser: number
  maxTherapistsPerPartner: number
  sessionTimeout: number
  paymentGateway: 'stripe' | 'paypal' | 'paystack'
  emailProvider: 'brevo' | 'sendgrid' | 'mailgun'
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  securityLevel: 'low' | 'medium' | 'high'
  dataRetentionDays: number
  apiRateLimit: number
}

export interface AdminNotification {
  id: string
  type: 'system_alert' | 'user_report' | 'payment_issue' | 'security_breach' | 'performance_warning'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  timestamp: string
  requiresAction: boolean
  actionTaken?: string
}

// Admin dashboard state interface
export interface AdminDashboardState {
  // Admin data
  admin: AdminData | null
  systemUsers: SystemUser[]
  systemStats: SystemStats | null
  systemSettings: SystemSettings | null
  
  // UI state
  isLoading: boolean
  activeSection: string
  sidebarCollapsed: boolean
  
  // Notifications
  notifications: AdminNotification[]
  
  // Sidebar state
  sidebarState: {
    isHovered: boolean
    activeItem: string
    expandedItems: string[]
    criticalAlerts: number
    pendingActions: number
  }
  
  // Card states
  cardStates: {
    statsCards: {
      'total-users': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'total-revenue': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'system-health': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'pending-verifications': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
    }
    userCards: Record<string, {
      isExpanded: boolean
      isHovered: boolean
      isActionMenuOpen: boolean
      isEditing: boolean
      isViewingDetails: boolean
      isSuspending: boolean
      isBanning: boolean
    }>
    systemCards: Record<string, {
      isExpanded: boolean
      isHovered: boolean
      isActionMenuOpen: boolean
      isConfiguring: boolean
      isTesting: boolean
      isRestarting: boolean
    }>
    quickActionCards: {
      'add-user': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'system-backup': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'generate-report': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
      'security-scan': { isLoading: boolean; isHovered: boolean; isExpanded: boolean }
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
export type AdminDashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_ADMIN_DATA'; payload: AdminData }
  | { type: 'SET_SYSTEM_USERS'; payload: SystemUser[] }
  | { type: 'SET_SYSTEM_STATS'; payload: SystemStats }
  | { type: 'SET_SYSTEM_SETTINGS'; payload: SystemSettings }
  | { type: 'ADD_NOTIFICATION'; payload: AdminNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_SIDEBAR_HOVER'; payload: boolean }
  | { type: 'SET_ACTIVE_SIDEBAR_ITEM'; payload: string }
  | { type: 'TOGGLE_SIDEBAR_ITEM_EXPANSION'; payload: string }
  | { type: 'UPDATE_SIDEBAR_ALERTS'; payload: { criticalAlerts: number; pendingActions: number } }
  | { type: 'SET_STATS_CARD_STATE'; payload: { card: keyof AdminDashboardState['cardStates']['statsCards']; state: Partial<AdminDashboardState['cardStates']['statsCards'][keyof AdminDashboardState['cardStates']['statsCards']]> } }
  | { type: 'SET_USER_CARD_STATE'; payload: { userId: string; state: Partial<AdminDashboardState['cardStates']['userCards'][string]> } }
  | { type: 'SET_SYSTEM_CARD_STATE'; payload: { systemId: string; state: Partial<AdminDashboardState['cardStates']['systemCards'][string]> } }
  | { type: 'SET_QUICK_ACTION_CARD_STATE'; payload: { card: keyof AdminDashboardState['cardStates']['quickActionCards']; state: Partial<AdminDashboardState['cardStates']['quickActionCards'][keyof AdminDashboardState['cardStates']['quickActionCards']]> } }
  | { type: 'SET_PRIMARY_BUTTON_STATE'; payload: { buttonId: string; state: Partial<AdminDashboardState['buttonStates']['primaryButtons'][string]> } }
  | { type: 'SET_ICON_BUTTON_STATE'; payload: { buttonId: string; state: Partial<AdminDashboardState['buttonStates']['iconButtons'][string]> } }
  | { type: 'SET_ICON_STATE'; payload: { iconId: string; state: Partial<AdminDashboardState['iconStates'][string]> } }

// Initial state
const initialState: AdminDashboardState = {
  admin: null,
  systemUsers: [],
  systemStats: null,
  systemSettings: null,
  isLoading: false,
  activeSection: 'overview',
  sidebarCollapsed: false,
  notifications: [],
  sidebarState: {
    isHovered: false,
    activeItem: 'overview',
    expandedItems: [],
    criticalAlerts: 0,
    pendingActions: 0
  },
  cardStates: {
    statsCards: {
      'total-users': { isLoading: false, isHovered: false, isExpanded: false },
      'total-revenue': { isLoading: false, isHovered: false, isExpanded: false },
      'system-health': { isLoading: false, isHovered: false, isExpanded: false },
      'pending-verifications': { isLoading: false, isHovered: false, isExpanded: false }
    },
    userCards: {},
    systemCards: {},
    quickActionCards: {
      'add-user': { isLoading: false, isHovered: false, isExpanded: false },
      'system-backup': { isLoading: false, isHovered: false, isExpanded: false },
      'generate-report': { isLoading: false, isHovered: false, isExpanded: false },
      'security-scan': { isLoading: false, isHovered: false, isExpanded: false }
    }
  },
  buttonStates: {
    primaryButtons: {},
    iconButtons: {}
  },
  iconStates: {}
}

// Reducer function
function adminDashboardReducer(state: AdminDashboardState, action: AdminDashboardAction): AdminDashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload }
    
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload }
    
    case 'SET_ADMIN_DATA':
      return { ...state, admin: action.payload }
    
    case 'SET_SYSTEM_USERS':
      return { ...state, systemUsers: action.payload }
    
    case 'SET_SYSTEM_STATS':
      return { ...state, systemStats: action.payload }
    
    case 'SET_SYSTEM_SETTINGS':
      return { ...state, systemSettings: action.payload }
    
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
    
    case 'UPDATE_SIDEBAR_ALERTS':
      return {
        ...state,
        sidebarState: {
          ...state.sidebarState,
          criticalAlerts: action.payload.criticalAlerts,
          pendingActions: action.payload.pendingActions
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
    
    case 'SET_USER_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          userCards: {
            ...state.cardStates.userCards,
            [action.payload.userId]: {
              ...state.cardStates.userCards[action.payload.userId],
              ...action.payload.state
            }
          }
        }
      }
    
    case 'SET_SYSTEM_CARD_STATE':
      return {
        ...state,
        cardStates: {
          ...state.cardStates,
          systemCards: {
            ...state.cardStates.systemCards,
            [action.payload.systemId]: {
              ...state.cardStates.systemCards[action.payload.systemId],
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
const AdminDashboardContext = createContext<{
  state: AdminDashboardState
  dispatch: React.Dispatch<AdminDashboardAction>
  fetchAdminData: () => Promise<void>
  fetchSystemUsers: () => Promise<void>
  fetchSystemStats: () => Promise<void>
  fetchSystemSettings: () => Promise<void>
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
  addNotification: (notification: AdminNotification) => void
  setSidebarHover: (isHovered: boolean) => void
  setActiveSidebarItem: (item: string) => void
  toggleSidebarItemExpansion: (item: string) => void
  updateSidebarAlerts: (criticalAlerts: number, pendingActions: number) => void
  setStatsCardState: (card: keyof AdminDashboardState['cardStates']['statsCards'], state: Partial<AdminDashboardState['cardStates']['statsCards'][keyof AdminDashboardState['cardStates']['statsCards']]>) => void
  setUserCardState: (userId: string, state: Partial<AdminDashboardState['cardStates']['userCards'][string]>) => void
  setSystemCardState: (systemId: string, state: Partial<AdminDashboardState['cardStates']['systemCards'][string]>) => void
  setQuickActionCardState: (card: keyof AdminDashboardState['cardStates']['quickActionCards'], state: Partial<AdminDashboardState['cardStates']['quickActionCards'][keyof AdminDashboardState['cardStates']['quickActionCards']]>) => void
  setPrimaryButtonState: (buttonId: string, state: Partial<AdminDashboardState['buttonStates']['primaryButtons'][string]>) => void
  setIconButtonState: (buttonId: string, state: Partial<AdminDashboardState['buttonStates']['iconButtons'][string]>) => void
  setIconState: (iconId: string, state: Partial<AdminDashboardState['iconStates'][string]>) => void
} | undefined>(undefined)

// Provider component
export function AdminDashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminDashboardReducer, initialState)

  // Data fetching functions
  const fetchAdminData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Mock data for now - replace with actual API call
      const mockAdminData: AdminData = {
        id: 'admin-1',
        full_name: 'System Administrator',
        email: 'admin@trpi.com',
        role: 'super_admin',
        permissions: ['all'],
        is_active: true,
        last_login: '2024-01-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z'
      }
      dispatch({ type: 'SET_ADMIN_DATA', payload: mockAdminData })
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const fetchSystemUsers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSystemUsers: SystemUser[] = [
        {
          id: 'user-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          user_type: 'user',
          is_verified: true,
          is_active: true,
          created_at: '2024-01-10T00:00:00Z',
          last_login: '2024-01-15T09:00:00Z',
          status: 'active'
        },
        {
          id: 'therapist-1',
          full_name: 'Dr. Sarah White',
          email: 'sarah@therapy.com',
          user_type: 'therapist',
          is_verified: true,
          is_active: true,
          created_at: '2024-01-05T00:00:00Z',
          last_login: '2024-01-15T08:30:00Z',
          status: 'active',
          total_sessions: 45,
          total_earnings: 6750
        }
      ]
      dispatch({ type: 'SET_SYSTEM_USERS', payload: mockSystemUsers })
    } catch (error) {
      console.error('Error fetching system users:', error)
    }
  }

  const fetchSystemStats = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSystemStats: SystemStats = {
        totalUsers: 1250,
        totalTherapists: 85,
        totalPartners: 12,
        totalSessions: 3456,
        totalRevenue: 125000,
        activeUsers: 890,
        pendingVerifications: 23,
        systemHealth: 'excellent',
        uptime: 99.9,
        averageResponseTime: 150,
        monthlyGrowth: {
          users: 15,
          revenue: 8,
          sessions: 12
        },
        topPerformingTherapists: [
          {
            id: 'therapist-1',
            name: 'Dr. Sarah White',
            sessions: 45,
            rating: 4.9,
            earnings: 6750
          }
        ],
        recentActivity: [
          {
            id: 'activity-1',
            type: 'user_registration',
            description: 'New user registered: john@example.com',
            timestamp: '2024-01-15T10:00:00Z',
            severity: 'low'
          }
        ]
      }
      dispatch({ type: 'SET_SYSTEM_STATS', payload: mockSystemStats })
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const fetchSystemSettings = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSystemSettings: SystemSettings = {
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        maxSessionsPerUser: 10,
        maxTherapistsPerPartner: 50,
        sessionTimeout: 3600,
        paymentGateway: 'stripe',
        emailProvider: 'brevo',
        backupFrequency: 'daily',
        securityLevel: 'high',
        dataRetentionDays: 365,
        apiRateLimit: 1000
      }
      dispatch({ type: 'SET_SYSTEM_SETTINGS', payload: mockSystemSettings })
    } catch (error) {
      console.error('Error fetching system settings:', error)
    }
  }

  // Helper functions
  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !state.sidebarCollapsed })
  }

  const setActiveSection = (section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }

  const addNotification = (notification: AdminNotification) => {
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

  const updateSidebarAlerts = (criticalAlerts: number, pendingActions: number) => {
    dispatch({ type: 'UPDATE_SIDEBAR_ALERTS', payload: { criticalAlerts, pendingActions } })
  }

  const setStatsCardState = (card: keyof AdminDashboardState['cardStates']['statsCards'], state: Partial<AdminDashboardState['cardStates']['statsCards'][keyof AdminDashboardState['cardStates']['statsCards']]>) => {
    dispatch({ type: 'SET_STATS_CARD_STATE', payload: { card, state } })
  }

  const setUserCardState = (userId: string, state: Partial<AdminDashboardState['cardStates']['userCards'][string]>) => {
    dispatch({ type: 'SET_USER_CARD_STATE', payload: { userId, state } })
  }

  const setSystemCardState = (systemId: string, state: Partial<AdminDashboardState['cardStates']['systemCards'][string]>) => {
    dispatch({ type: 'SET_SYSTEM_CARD_STATE', payload: { systemId, state } })
  }

  const setQuickActionCardState = (card: keyof AdminDashboardState['cardStates']['quickActionCards'], state: Partial<AdminDashboardState['cardStates']['quickActionCards'][keyof AdminDashboardState['cardStates']['quickActionCards']]>) => {
    dispatch({ type: 'SET_QUICK_ACTION_CARD_STATE', payload: { card, state } })
  }

  const setPrimaryButtonState = (buttonId: string, state: Partial<AdminDashboardState['buttonStates']['primaryButtons'][string]>) => {
    dispatch({ type: 'SET_PRIMARY_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconButtonState = (buttonId: string, state: Partial<AdminDashboardState['buttonStates']['iconButtons'][string]>) => {
    dispatch({ type: 'SET_ICON_BUTTON_STATE', payload: { buttonId, state } })
  }

  const setIconState = (iconId: string, state: Partial<AdminDashboardState['iconStates'][string]>) => {
    dispatch({ type: 'SET_ICON_STATE', payload: { iconId, state } })
  }

  // Load initial data
  useEffect(() => {
    fetchAdminData()
    fetchSystemUsers()
    fetchSystemStats()
    fetchSystemSettings()
  }, [])

  const contextValue = {
    state,
    dispatch,
    fetchAdminData,
    fetchSystemUsers,
    fetchSystemStats,
    fetchSystemSettings,
    toggleSidebar,
    setActiveSection,
    addNotification,
    setSidebarHover,
    setActiveSidebarItem,
    toggleSidebarItemExpansion,
    updateSidebarAlerts,
    setStatsCardState,
    setUserCardState,
    setSystemCardState,
    setQuickActionCardState,
    setPrimaryButtonState,
    setIconButtonState,
    setIconState
  }

  return (
    <AdminDashboardContext.Provider value={contextValue}>
      {children}
    </AdminDashboardContext.Provider>
  )
}

// Hook to use the context
export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext)
  if (context === undefined) {
    throw new Error('useAdminDashboard must be used within an AdminDashboardProvider')
  }
  return context
}
