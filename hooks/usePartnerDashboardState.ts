"use client"

import { useCallback, useMemo } from 'react'
import { usePartnerDashboard } from '@/context/partner-dashboard-context'

// Hook for managing partner sidebar state
export function usePartnerSidebarState() {
  const { state, setSidebarHover, setActiveSidebarItem, toggleSidebarItemExpansion } = usePartnerDashboard()

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
    notificationsCount: state.sidebarState.notificationsCount,
    unreadMessages: state.sidebarState.unreadMessages,
    isActive,
    isExpanded,
    setHover: setSidebarHover,
    handleItemClick,
    handleItemToggle
  }
}

// Hook for managing partner card states
export function usePartnerCardState() {
  const { state, setStatsCardState, setMemberCardState, setSessionCardState, setQuickActionCardState } = usePartnerDashboard()

  const getStatsCardState = useCallback((card: keyof typeof state.cardStates.statsCards) => {
    return state.cardStates.statsCards[card]
  }, [state.cardStates.statsCards])

  const getMemberCardState = useCallback((memberId: string) => {
    return state.cardStates.memberCards[memberId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingHistory: false,
      isSuspending: false
    }
  }, [state.cardStates.memberCards])

  const getSessionCardState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false,
      isViewingDetails: false
    }
  }, [state.cardStates.sessionCards])

  const getQuickActionCardState = useCallback((card: keyof typeof state.cardStates.quickActionCards) => {
    return state.cardStates.quickActionCards[card]
  }, [state.cardStates.quickActionCards])

  const setCardHover = useCallback((cardType: 'stats' | 'member' | 'session' | 'quickAction', cardId: string, isHovered: boolean) => {
    if (cardType === 'stats') {
      setStatsCardState(cardId as keyof typeof state.cardStates.statsCards, { isHovered })
    } else if (cardType === 'member') {
      setMemberCardState(cardId, { isHovered })
    } else if (cardType === 'session') {
      setSessionCardState(cardId, { isHovered })
    } else if (cardType === 'quickAction') {
      setQuickActionCardState(cardId as keyof typeof state.cardStates.quickActionCards, { isHovered })
    }
  }, [setStatsCardState, setMemberCardState, setSessionCardState, setQuickActionCardState, state.cardStates])

  return {
    getStatsCardState,
    getMemberCardState,
    getSessionCardState,
    getQuickActionCardState,
    setCardHover,
    setStatsCardState,
    setMemberCardState,
    setSessionCardState,
    setQuickActionCardState
  }
}

// Hook for managing partner button states
export function usePartnerButtonState() {
  const { state, setPrimaryButtonState, setIconButtonState } = usePartnerDashboard()

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

// Hook for managing partner icon states
export function usePartnerIconState() {
  const { state, setIconState } = usePartnerDashboard()

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

// Hook for managing partner member states
export function usePartnerMemberState() {
  const { state, setMemberCardState } = usePartnerDashboard()

  const getMemberState = useCallback((memberId: string) => {
    return state.cardStates.memberCards[memberId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingHistory: false,
      isSuspending: false
    }
  }, [state.cardStates.memberCards])

  const expandMember = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isExpanded: true })
  }, [setMemberCardState])

  const collapseMember = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isExpanded: false })
  }, [setMemberCardState])

  const toggleMemberExpansion = useCallback((memberId: string) => {
    const currentState = getMemberState(memberId)
    setMemberCardState(memberId, { isExpanded: !currentState.isExpanded })
  }, [getMemberState, setMemberCardState])

  const openMemberActionMenu = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isActionMenuOpen: true })
  }, [setMemberCardState])

  const closeMemberActionMenu = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isActionMenuOpen: false })
  }, [setMemberCardState])

  const startMemberEdit = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isEditing: true })
  }, [setMemberCardState])

  const stopMemberEdit = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isEditing: false })
  }, [setMemberCardState])

  const startViewingMemberHistory = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isViewingHistory: true })
  }, [setMemberCardState])

  const stopViewingMemberHistory = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isViewingHistory: false })
  }, [setMemberCardState])

  const startMemberSuspension = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isSuspending: true })
  }, [setMemberCardState])

  const stopMemberSuspension = useCallback((memberId: string) => {
    setMemberCardState(memberId, { isSuspending: false })
  }, [setMemberCardState])

  return {
    getMemberState,
    expandMember,
    collapseMember,
    toggleMemberExpansion,
    openMemberActionMenu,
    closeMemberActionMenu,
    startMemberEdit,
    stopMemberEdit,
    startViewingMemberHistory,
    stopViewingMemberHistory,
    startMemberSuspension,
    stopMemberSuspension
  }
}

// Hook for managing partner session states
export function usePartnerSessionState() {
  const { state, setSessionCardState } = usePartnerDashboard()

  const getSessionState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false,
      isViewingDetails: false
    }
  }, [state.cardStates.sessionCards])

  const expandSession = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isExpanded: true })
  }, [setSessionCardState])

  const collapseSession = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isExpanded: false })
  }, [setSessionCardState])

  const toggleSessionExpansion = useCallback((sessionId: string) => {
    const currentState = getSessionState(sessionId)
    setSessionCardState(sessionId, { isExpanded: !currentState.isExpanded })
  }, [getSessionState, setSessionCardState])

  const openSessionActionMenu = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isActionMenuOpen: true })
  }, [setSessionCardState])

  const closeSessionActionMenu = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isActionMenuOpen: false })
  }, [setSessionCardState])

  const startSessionReschedule = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isRescheduling: true })
  }, [setSessionCardState])

  const stopSessionReschedule = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isRescheduling: false })
  }, [setSessionCardState])

  const startSessionCancel = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isCancelling: true })
  }, [setSessionCardState])

  const stopSessionCancel = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isCancelling: false })
  }, [setSessionCardState])

  const startViewingSessionDetails = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isViewingDetails: true })
  }, [setSessionCardState])

  const stopViewingSessionDetails = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isViewingDetails: false })
  }, [setSessionCardState])

  return {
    getSessionState,
    expandSession,
    collapseSession,
    toggleSessionExpansion,
    openSessionActionMenu,
    closeSessionActionMenu,
    startSessionReschedule,
    stopSessionReschedule,
    startSessionCancel,
    stopSessionCancel,
    startViewingSessionDetails,
    stopViewingSessionDetails
  }
}

// Hook for managing partner notifications
export function usePartnerNotificationState() {
  const { state, addNotification, updateSidebarNotifications } = usePartnerDashboard()

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length
  }, [state.notifications])

  const addSuccessNotification = useCallback((title: string, message: string) => {
    addNotification({ 
      id: `success_${Date.now()}`,
      type: 'success', 
      title, 
      message, 
      read: false,
      timestamp: new Date().toISOString()
    })
  }, [addNotification])

  const addErrorNotification = useCallback((title: string, message: string) => {
    addNotification({ 
      id: `error_${Date.now()}`,
      type: 'error', 
      title, 
      message, 
      read: false,
      timestamp: new Date().toISOString()
    })
  }, [addNotification])

  const addWarningNotification = useCallback((title: string, message: string) => {
    addNotification({ 
      id: `warning_${Date.now()}`,
      type: 'warning', 
      title, 
      message, 
      read: false,
      timestamp: new Date().toISOString()
    })
  }, [addNotification])

  const addInfoNotification = useCallback((title: string, message: string) => {
    addNotification({ 
      id: `info_${Date.now()}`,
      type: 'info', 
      title, 
      message, 
      read: false,
      timestamp: new Date().toISOString()
    })
  }, [addNotification])

  return {
    notifications: state.notifications,
    unreadCount,
    addSuccessNotification,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
    updateSidebarNotifications
  }
}

// Hook for partner data management
export function usePartnerData() {
  const { state, fetchPartnerData, fetchMembers, fetchSessions, fetchStats } = usePartnerDashboard()

  const partnerInfo = useMemo(() => {
    if (!state.partner) return null
    return {
      id: state.partner.id,
      name: state.partner.full_name,
      email: state.partner.email,
      companyName: state.partner.company_name,
      subscriptionPlan: state.partner.subscription_plan,
      isVerified: state.partner.is_verified,
      isActive: state.partner.is_active,
      totalMembers: state.partner.total_members,
      totalSessions: state.partner.total_sessions,
      monthlyBudget: state.partner.monthly_budget,
      createdAt: state.partner.created_at,
      subscriptionEndDate: state.partner.subscription_end_date
    }
  }, [state.partner])

  const memberStats = useMemo(() => {
    const total = state.members.length
    const active = state.members.filter(m => m.status === 'active').length
    const inactive = state.members.filter(m => m.status === 'inactive').length
    const pending = state.members.filter(m => m.status === 'pending').length

    return {
      total,
      active,
      inactive,
      pending,
      hasActive: active > 0,
      hasInactive: inactive > 0,
      hasPending: pending > 0
    }
  }, [state.members])

  const sessionStats = useMemo(() => {
    const upcoming = state.upcomingSessions.length
    const past = state.pastSessions.length
    const total = upcoming + past
    
    return {
      upcoming,
      past,
      total,
      hasUpcoming: upcoming > 0,
      hasPast: past > 0
    }
  }, [state.upcomingSessions.length, state.pastSessions.length])

  const budgetStats = useMemo(() => {
    if (!state.stats) return null
    return {
      monthlyBudget: state.stats.monthlyBudget,
      budgetUsed: state.stats.budgetUsed,
      budgetRemaining: state.stats.budgetRemaining,
      averageSessionCost: state.stats.averageSessionCost,
      budgetUtilization: (state.stats.budgetUsed / state.stats.monthlyBudget) * 100
    }
  }, [state.stats])

  return {
    partnerInfo,
    memberStats,
    sessionStats,
    budgetStats,
    fetchPartnerData,
    fetchMembers,
    fetchSessions,
    fetchStats
  }
}
