"use client"

import { useCallback, useMemo } from 'react'
import { useDashboard } from '@/context/dashboard-context'

// Hook for managing sidebar state
export function useSidebarState() {
  const { state, setSidebarHover, setActiveSidebarItem, toggleSidebarItemExpansion } = useDashboard()

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
    isActive,
    isExpanded,
    setHover: setSidebarHover,
    handleItemClick,
    handleItemToggle
  }
}

// Hook for managing card states
export function useCardState() {
  const { state, setStatsCardState, setSessionCardState, setQuickActionCardState } = useDashboard()

  const getStatsCardState = useCallback((card: keyof typeof state.cardStates.statsCards) => {
    return state.cardStates.statsCards[card]
  }, [state.cardStates.statsCards])

  const getSessionCardState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false
    }
  }, [state.cardStates.sessionCards])

  const getQuickActionCardState = useCallback((card: keyof typeof state.cardStates.quickActionCards) => {
    return state.cardStates.quickActionCards[card]
  }, [state.cardStates.quickActionCards])

  const setCardHover = useCallback((cardType: 'stats' | 'session' | 'quickAction', cardId: string, isHovered: boolean) => {
    if (cardType === 'stats') {
      setStatsCardState(cardId as keyof typeof state.cardStates.statsCards, { isHovered })
    } else if (cardType === 'session') {
      setSessionCardState(cardId, { isHovered })
    } else if (cardType === 'quickAction') {
      setQuickActionCardState(cardId as keyof typeof state.cardStates.quickActionCards, { isHovered })
    }
  }, [setStatsCardState, setSessionCardState, setQuickActionCardState, state.cardStates])

  return {
    getStatsCardState,
    getSessionCardState,
    getQuickActionCardState,
    setCardHover,
    setStatsCardState,
    setSessionCardState,
    setQuickActionCardState
  }
}

// Hook for managing button states
export function useButtonState() {
  const { state, setPrimaryButtonState, setIconButtonState } = useDashboard()

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

// Hook for managing icon states
export function useIconState() {
  const { state, setIconState } = useDashboard()

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

// Hook for managing session states
export function useSessionState() {
  const { state, setSessionCardState } = useDashboard()

  const getSessionState = useCallback((sessionId: string) => {
    return state.cardStates.sessionCards[sessionId] || {
      isExpanded: false,
      isHovered: false,
      isActionMenuOpen: false,
      isRescheduling: false,
      isCancelling: false
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
    stopSessionCancel
  }
}

// Hook for managing notifications
export function useNotificationState() {
  const { state, addNotification, updateSidebarNotifications } = useDashboard()

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
