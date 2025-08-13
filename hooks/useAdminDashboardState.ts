"use client"

import { useCallback, useMemo } from 'react'
import { useAdminDashboard } from '@/context/admin-dashboard-context'

// Hook for managing admin sidebar state
export function useAdminSidebarState() {
  const { state, setSidebarHover, setActiveSidebarItem, toggleSidebarItemExpansion } = useAdminDashboard()

  const isActive = useCallback((item: string) => {
    return state.sidebarState.activeItem === item
  }, [state.sidebarState.activeItem])

  const isExpanded = useCallback((item: string) => {
    return state.sidebarState.expandedItems.includes(item)
  }, [state.sidebarState.expandedItems])

  const handleItemClick = useCallback((item: string) => {
    setActiveSidebarItem(item)
  }, [setActiveSidebarItem])

  const handleItemToggle = useCallback((item: string) => {
    toggleSidebarItemExpansion(item)
  }, [toggleSidebarItemExpansion])

  return {
    isHovered: state.sidebarState.isHovered,
    activeItem: state.sidebarState.activeItem,
    expandedItems: state.sidebarState.expandedItems,
    criticalAlerts: state.sidebarState.criticalAlerts,
    pendingActions: state.sidebarState.pendingActions,
    isActive,
    isExpanded,
    setHover: setSidebarHover,
    handleItemClick,
    handleItemToggle
  }
}

// Hook for managing admin card states
export function useAdminCardState() {
  const { state, setStatsCardState, setUserCardState, setSystemCardState, setQuickActionCardState } = useAdminDashboard()

  const getStatsCardState = useCallback((card: keyof typeof state.cardStates.statsCards) => {
    return state.cardStates.statsCards[card]
  }, [state.cardStates.statsCards])

  const getUserCardState = useCallback((userId: string) => {
    return state.cardStates.userCards[userId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingDetails: false,
      isSuspending: false,
      isBanning: false
    }
  }, [state.cardStates.userCards])

  const getSystemCardState = useCallback((systemId: string) => {
    return state.cardStates.systemCards[systemId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isConfiguring: false,
      isTesting: false,
      isRestarting: false
    }
  }, [state.cardStates.systemCards])

  const getQuickActionCardState = useCallback((card: keyof typeof state.cardStates.quickActionCards) => {
    return state.cardStates.quickActionCards[card]
  }, [state.cardStates.quickActionCards])

  const setCardHover = useCallback((cardType: 'stats' | 'user' | 'system' | 'quickAction', cardId: string, isHovered: boolean) => {
    if (cardType === 'stats') {
      setStatsCardState(cardId as keyof typeof state.cardStates.statsCards, { isHovered })
    } else if (cardType === 'user') {
      setUserCardState(cardId, { isHovered })
    } else if (cardType === 'system') {
      setSystemCardState(cardId, { isHovered })
    } else if (cardType === 'quickAction') {
      setQuickActionCardState(cardId as keyof typeof state.cardStates.quickActionCards, { isHovered })
    }
  }, [setStatsCardState, setUserCardState, setSystemCardState, setQuickActionCardState, state.cardStates])

  return {
    getStatsCardState,
    getUserCardState,
    getSystemCardState,
    getQuickActionCardState,
    setCardHover,
    setStatsCardState,
    setUserCardState,
    setSystemCardState,
    setQuickActionCardState
  }
}

// Hook for managing admin button states
export function useAdminButtonState() {
  const { state, setPrimaryButtonState, setIconButtonState } = useAdminDashboard()

  const getPrimaryButtonState = useCallback((buttonId: string) => {
    return state.buttonStates.primaryButtons[buttonId] || {
      isLoading: false,
      isDisabled: false,
      isPressed: false,
      variant: 'default' as const
    }
  }, [state.buttonStates.primaryButtons])

  const getIconButtonState = useCallback((buttonId: string) => {
    return state.buttonStates.iconButtons[buttonId] || {
      isHovered: false,
      isPressed: false,
      isActive: false,
      tooltipVisible: false
    }
  }, [state.buttonStates.iconButtons])

  const setButtonLoading = useCallback((buttonId: string, isLoading: boolean) => {
    setPrimaryButtonState(buttonId, { isLoading })
  }, [setPrimaryButtonState])

  const setButtonDisabled = useCallback((buttonId: string, isDisabled: boolean) => {
    setPrimaryButtonState(buttonId, { isDisabled })
  }, [setPrimaryButtonState])

  const setButtonPressed = useCallback((buttonId: string, isPressed: boolean) => {
    setPrimaryButtonState(buttonId, { isPressed })
  }, [setPrimaryButtonState])

  const setIconButtonHover = useCallback((buttonId: string, isHovered: boolean) => {
    setIconButtonState(buttonId, { isHovered })
  }, [setIconButtonState])

  const setIconButtonActive = useCallback((buttonId: string, isActive: boolean) => {
    setIconButtonState(buttonId, { isActive })
  }, [setIconButtonState])

  return {
    getPrimaryButtonState,
    getIconButtonState,
    setButtonLoading,
    setButtonDisabled,
    setButtonPressed,
    setIconButtonHover,
    setIconButtonActive,
    setPrimaryButtonState,
    setIconButtonState
  }
}

// Hook for managing admin icon states
export function useAdminIconState() {
  const { state, setIconState } = useAdminDashboard()

  const getIconState = useCallback((iconId: string) => {
    return state.iconStates[iconId] || {
      isHovered: false,
      isActive: false,
      isAnimated: false,
      color: 'currentColor',
      size: 'md' as const
    }
  }, [state.iconStates])

  const setIconHover = useCallback((iconId: string, isHovered: boolean) => {
    setIconState(iconId, { isHovered })
  }, [setIconState])

  const setIconActive = useCallback((iconId: string, isActive: boolean) => {
    setIconState(iconId, { isActive })
  }, [setIconState])

  const setIconAnimation = useCallback((iconId: string, isAnimated: boolean) => {
    setIconState(iconId, { isAnimated })
  }, [setIconState])

  const setIconColor = useCallback((iconId: string, color: string) => {
    setIconState(iconId, { color })
  }, [setIconState])

  const setIconSize = useCallback((iconId: string, size: 'sm' | 'md' | 'lg') => {
    setIconState(iconId, { size })
  }, [setIconState])

  return {
    getIconState,
    setIconHover,
    setIconActive,
    setIconAnimation,
    setIconColor,
    setIconSize,
    setIconState
  }
}

// Hook for managing admin user states
export function useAdminUserState() {
  const { state, setUserCardState } = useAdminDashboard()

  const getUserState = useCallback((userId: string) => {
    return state.cardStates.userCards[userId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingDetails: false,
      isSuspending: false,
      isBanning: false
    }
  }, [state.cardStates.userCards])

  const expandUser = useCallback((userId: string) => {
    setUserCardState(userId, { isExpanded: true })
  }, [setUserCardState])

  const collapseUser = useCallback((userId: string) => {
    setUserCardState(userId, { isExpanded: false })
  }, [setUserCardState])

  const toggleUserExpansion = useCallback((userId: string) => {
    const currentState = getUserState(userId)
    setUserCardState(userId, { isExpanded: !currentState.isExpanded })
  }, [getUserState, setUserCardState])

  const openUserActionMenu = useCallback((userId: string) => {
    setUserCardState(userId, { isActionMenuOpen: true })
  }, [setUserCardState])

  const closeUserActionMenu = useCallback((userId: string) => {
    setUserCardState(userId, { isActionMenuOpen: false })
  }, [setUserCardState])

  const startUserEdit = useCallback((userId: string) => {
    setUserCardState(userId, { isEditing: true })
  }, [setUserCardState])

  const stopUserEdit = useCallback((userId: string) => {
    setUserCardState(userId, { isEditing: false })
  }, [setUserCardState])

  const startViewingUserDetails = useCallback((userId: string) => {
    setUserCardState(userId, { isViewingDetails: true })
  }, [setUserCardState])

  const stopViewingUserDetails = useCallback((userId: string) => {
    setUserCardState(userId, { isViewingDetails: false })
  }, [setUserCardState])

  const startUserSuspension = useCallback((userId: string) => {
    setUserCardState(userId, { isSuspending: true })
  }, [setUserCardState])

  const stopUserSuspension = useCallback((userId: string) => {
    setUserCardState(userId, { isSuspending: false })
  }, [setUserCardState])

  const startUserBan = useCallback((userId: string) => {
    setUserCardState(userId, { isBanning: true })
  }, [setUserCardState])

  const stopUserBan = useCallback((userId: string) => {
    setUserCardState(userId, { isBanning: false })
  }, [setUserCardState])

  return {
    getUserState,
    expandUser,
    collapseUser,
    toggleUserExpansion,
    openUserActionMenu,
    closeUserActionMenu,
    startUserEdit,
    stopUserEdit,
    startViewingUserDetails,
    stopViewingUserDetails,
    startUserSuspension,
    stopUserSuspension,
    startUserBan,
    stopUserBan
  }
}

// Hook for managing admin system states
export function useAdminSystemState() {
  const { state, setSystemCardState } = useAdminDashboard()

  const getSystemState = useCallback((systemId: string) => {
    return state.cardStates.systemCards[systemId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isConfiguring: false,
      isTesting: false,
      isRestarting: false
    }
  }, [state.cardStates.systemCards])

  const expandSystem = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isExpanded: true })
  }, [setSystemCardState])

  const collapseSystem = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isExpanded: false })
  }, [setSystemCardState])

  const toggleSystemExpansion = useCallback((systemId: string) => {
    const currentState = getSystemState(systemId)
    setSystemCardState(systemId, { isExpanded: !currentState.isExpanded })
  }, [getSystemState, setSystemCardState])

  const openSystemActionMenu = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isActionMenuOpen: true })
  }, [setSystemCardState])

  const closeSystemActionMenu = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isActionMenuOpen: false })
  }, [setSystemCardState])

  const startSystemConfiguration = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isConfiguring: true })
  }, [setSystemCardState])

  const stopSystemConfiguration = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isConfiguring: false })
  }, [setSystemCardState])

  const startSystemTest = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isTesting: true })
  }, [setSystemCardState])

  const stopSystemTest = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isTesting: false })
  }, [setSystemCardState])

  const startSystemRestart = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isRestarting: true })
  }, [setSystemCardState])

  const stopSystemRestart = useCallback((systemId: string) => {
    setSystemCardState(systemId, { isRestarting: false })
  }, [setSystemCardState])

  return {
    getSystemState,
    expandSystem,
    collapseSystem,
    toggleSystemExpansion,
    openSystemActionMenu,
    closeSystemActionMenu,
    startSystemConfiguration,
    stopSystemConfiguration,
    startSystemTest,
    stopSystemTest,
    startSystemRestart,
    stopSystemRestart
  }
}

// Hook for managing admin notifications
export function useAdminNotificationState() {
  const { state, addNotification, updateSidebarAlerts } = useAdminDashboard()

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length
  }, [state.notifications])

  const criticalAlerts = useMemo(() => {
    return state.notifications.filter(n => n.severity === 'critical' && !n.read).length
  }, [state.notifications])

  const pendingActions = useMemo(() => {
    return state.notifications.filter(n => n.requiresAction && !n.read).length
  }, [state.notifications])

  const addSystemAlert = useCallback((title: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    addNotification({
      type: 'system_alert',
      title,
      message,
      severity,
      read: false,
      timestamp: new Date().toISOString(),
      requiresAction: severity === 'high' || severity === 'critical'
    })
  }, [addNotification])

  const addUserReport = useCallback((title: string, message: string) => {
    addNotification({
      type: 'user_report',
      title,
      message,
      severity: 'medium',
      read: false,
      timestamp: new Date().toISOString(),
      requiresAction: true
    })
  }, [addNotification])

  const addPaymentIssue = useCallback((title: string, message: string) => {
    addNotification({
      type: 'payment_issue',
      title,
      message,
      severity: 'high',
      read: false,
      timestamp: new Date().toISOString(),
      requiresAction: true
    })
  }, [addNotification])

  const addSecurityBreach = useCallback((title: string, message: string) => {
    addNotification({
      type: 'security_breach',
      title,
      message,
      severity: 'critical',
      read: false,
      timestamp: new Date().toISOString(),
      requiresAction: true
    })
  }, [addNotification])

  const addPerformanceWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'performance_warning',
      title,
      message,
      severity: 'medium',
      read: false,
      timestamp: new Date().toISOString(),
      requiresAction: false
    })
  }, [addNotification])

  return {
    notifications: state.notifications,
    unreadCount,
    criticalAlerts,
    pendingActions,
    addSystemAlert,
    addUserReport,
    addPaymentIssue,
    addSecurityBreach,
    addPerformanceWarning,
    updateSidebarAlerts
  }
}

// Hook for admin data management
export function useAdminData() {
  const { state, fetchAdminData, fetchSystemUsers, fetchSystemStats, fetchSystemSettings } = useAdminDashboard()

  const adminInfo = useMemo(() => {
    if (!state.admin) return null
    return {
      id: state.admin.id,
      name: state.admin.full_name,
      email: state.admin.email,
      role: state.admin.role,
      permissions: state.admin.permissions,
      isActive: state.admin.is_active,
      lastLogin: state.admin.last_login,
      createdAt: state.admin.created_at
    }
  }, [state.admin])

  const userStats = useMemo(() => {
    const total = state.systemUsers.length
    const users = state.systemUsers.filter(u => u.user_type === 'user').length
    const therapists = state.systemUsers.filter(u => u.user_type === 'therapist').length
    const partners = state.systemUsers.filter(u => u.user_type === 'partner').length
    const admins = state.systemUsers.filter(u => u.user_type === 'admin').length
    const active = state.systemUsers.filter(u => u.is_active).length
    const verified = state.systemUsers.filter(u => u.is_verified).length
    const suspended = state.systemUsers.filter(u => u.status === 'suspended').length
    const banned = state.systemUsers.filter(u => u.status === 'banned').length

    return {
      total,
      users,
      therapists,
      partners,
      admins,
      active,
      verified,
      suspended,
      banned,
      hasUsers: users > 0,
      hasTherapists: therapists > 0,
      hasPartners: partners > 0,
      hasAdmins: admins > 0
    }
  }, [state.systemUsers])

  const systemHealth = useMemo(() => {
    if (!state.systemStats) return null
    return {
      health: state.systemStats.systemHealth,
      uptime: state.systemStats.uptime,
      averageResponseTime: state.systemStats.averageResponseTime,
      isHealthy: state.systemStats.systemHealth === 'excellent' || state.systemStats.systemHealth === 'good',
      needsAttention: state.systemStats.systemHealth === 'warning' || state.systemStats.systemHealth === 'critical'
    }
  }, [state.systemStats])

  const revenueStats = useMemo(() => {
    if (!state.systemStats) return null
    return {
      totalRevenue: state.systemStats.totalRevenue,
      monthlyGrowth: state.systemStats.monthlyGrowth.revenue,
      averageSessionCost: state.systemStats.totalRevenue / state.systemStats.totalSessions || 0,
      topPerformingTherapists: state.systemStats.topPerformingTherapists
    }
  }, [state.systemStats])

  return {
    adminInfo,
    userStats,
    systemHealth,
    revenueStats,
    fetchAdminData,
    fetchSystemUsers,
    fetchSystemStats,
    fetchSystemSettings
  }
}
