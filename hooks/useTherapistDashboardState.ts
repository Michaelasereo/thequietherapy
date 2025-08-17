"use client"

import { useCallback, useMemo } from 'react'
import { useTherapistDashboard } from '@/context/therapist-dashboard-context'

// Hook for managing therapist sidebar state
export function useTherapistSidebarState() {
  const { state, setSidebarHover, setActiveSidebarItem, toggleSidebarItemExpansion } = useTherapistDashboard()

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

// Hook for managing therapist card states
export function useTherapistCardState() {
  const { state, setStatsCardState, setSessionCardState, setClientCardState, setQuickActionCardState } = useTherapistDashboard()

  const getStatsCardState = useCallback((card: keyof typeof state.cardStates.statsCards) => {
    return state.cardStates.statsCards[card]
  }, [state.cardStates.statsCards])

  const getSessionCardState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false,
      isTakingNotes: false
    }
  }, [state.cardStates.sessionCards])

  const getClientCardState = useCallback((clientId: string) => {
    return state.cardStates.clientCards[clientId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingHistory: false
    }
  }, [state.cardStates.clientCards])

  const getQuickActionCardState = useCallback((card: keyof typeof state.cardStates.quickActionCards) => {
    return state.cardStates.quickActionCards[card]
  }, [state.cardStates.quickActionCards])

  const setCardHover = useCallback((cardType: 'stats' | 'session' | 'client' | 'quickAction', cardId: string, isHovered: boolean) => {
    if (cardType === 'stats') {
      setStatsCardState(cardId as keyof typeof state.cardStates.statsCards, { isHovered })
    } else if (cardType === 'session') {
      setSessionCardState(cardId, { isHovered })
    } else if (cardType === 'client') {
      setClientCardState(cardId, { isHovered })
    } else if (cardType === 'quickAction') {
      setQuickActionCardState(cardId as keyof typeof state.cardStates.quickActionCards, { isHovered })
    }
  }, [setStatsCardState, setSessionCardState, setClientCardState, setQuickActionCardState, state.cardStates])

  return {
    getStatsCardState,
    getSessionCardState,
    getClientCardState,
    getQuickActionCardState,
    setCardHover,
    setStatsCardState,
    setSessionCardState,
    setClientCardState,
    setQuickActionCardState
  }
}

// Hook for managing therapist button states
export function useTherapistButtonState() {
  const { state, setPrimaryButtonState, setIconButtonState } = useTherapistDashboard()

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

// Hook for managing therapist icon states
export function useTherapistIconState() {
  const { state, setIconState } = useTherapistDashboard()

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

// Hook for managing therapist session states
export function useTherapistSessionState() {
  const { state, setSessionCardState } = useTherapistDashboard()

  const getSessionState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false,
      isTakingNotes: false
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

  const startTakingNotes = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isTakingNotes: true })
  }, [setSessionCardState])

  const stopTakingNotes = useCallback((sessionId: string) => {
    setSessionCardState(sessionId, { isTakingNotes: false })
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
    startTakingNotes,
    stopTakingNotes
  }
}

// Hook for managing therapist client states
export function useTherapistClientState() {
  const { state, setClientCardState } = useTherapistDashboard()

  const getClientState = useCallback((clientId: string) => {
    return state.cardStates.clientCards[clientId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isEditing: false,
      isViewingHistory: false
    }
  }, [state.cardStates.clientCards])

  const expandClient = useCallback((clientId: string) => {
    setClientCardState(clientId, { isExpanded: true })
  }, [setClientCardState])

  const collapseClient = useCallback((clientId: string) => {
    setClientCardState(clientId, { isExpanded: false })
  }, [setClientCardState])

  const toggleClientExpansion = useCallback((clientId: string) => {
    const currentState = getClientState(clientId)
    setClientCardState(clientId, { isExpanded: !currentState.isExpanded })
  }, [getClientState, setClientCardState])

  const openClientActionMenu = useCallback((clientId: string) => {
    setClientCardState(clientId, { isActionMenuOpen: true })
  }, [setClientCardState])

  const closeClientActionMenu = useCallback((clientId: string) => {
    setClientCardState(clientId, { isActionMenuOpen: false })
  }, [setClientCardState])

  const startClientEdit = useCallback((clientId: string) => {
    setClientCardState(clientId, { isEditing: true })
  }, [setClientCardState])

  const stopClientEdit = useCallback((clientId: string) => {
    setClientCardState(clientId, { isEditing: false })
  }, [setClientCardState])

  const startViewingClientHistory = useCallback((clientId: string) => {
    setClientCardState(clientId, { isViewingHistory: true })
  }, [setClientCardState])

  const stopViewingClientHistory = useCallback((clientId: string) => {
    setClientCardState(clientId, { isViewingHistory: false })
  }, [setClientCardState])

  return {
    getClientState,
    expandClient,
    collapseClient,
    toggleClientExpansion,
    openClientActionMenu,
    closeClientActionMenu,
    startClientEdit,
    stopClientEdit,
    startViewingClientHistory,
    stopViewingClientHistory
  }
}

// Hook for managing therapist notifications
export function useTherapistNotificationState() {
  const { state, addNotification, updateSidebarNotifications } = useTherapistDashboard()

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length
  }, [state.notifications])

  const addSuccessNotification = useCallback((title: string, message: string) => {
    addNotification({ type: 'success', title, message, read: false })
  }, [addNotification])

  const addErrorNotification = useCallback((title: string, message: string) => {
    addNotification({ type: 'error', title, message, read: false })
  }, [addNotification])

  const addWarningNotification = useCallback((title: string, message: string) => {
    addNotification({ type: 'warning', title, message, read: false })
  }, [addNotification])

  const addInfoNotification = useCallback((title: string, message: string) => {
    addNotification({ type: 'info', title, message, read: false })
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

// Hook for therapist data management
export function useTherapistData() {
  const { state, fetchTherapistData, fetchClients, fetchSessions, fetchStats } = useTherapistDashboard()

  const therapistInfo = useMemo(() => {
    if (!state.therapist) return null
    return {
      id: state.therapist.id,
      name: state.therapist.full_name,
      email: state.therapist.email,
      specialization: state.therapist.specialization,
      licenseNumber: state.therapist.license_number,
      isVerified: state.therapist.is_verified,
      isApproved: state.therapist.is_verified,
      isActive: state.therapist.is_active,
      rating: state.therapist.rating,
      totalSessions: state.therapist.total_sessions,
      totalClients: state.therapist.total_clients,
      hourlyRate: state.therapist.hourly_rate,
      availability: state.therapist.availability
    }
  }, [state.therapist])

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

  const clientStats = useMemo(() => {
    const total = state.clients.length
    const active = state.clients.filter(c => c.status === 'active').length
    const inactive = state.clients.filter(c => c.status === 'inactive').length
    const pending = state.clients.filter(c => c.status === 'pending').length

    return {
      total,
      active,
      inactive,
      pending,
      hasActive: active > 0,
      hasInactive: inactive > 0,
      hasPending: pending > 0
    }
  }, [state.clients])

  return {
    therapistInfo,
    sessionStats,
    clientStats,
    fetchTherapistData,
    fetchClients,
    fetchSessions,
    fetchStats
  }
}
