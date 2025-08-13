"use client"

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { useDashboard } from '@/context/dashboard-context'

// Hook for optimized state updates
export function useOptimizedState() {
  const { state, dispatch } = useDashboard()
  const updateQueue = useRef<Array<() => void>>([])
  const isProcessing = useRef(false)

  // Batch state updates
  const batchUpdate = useCallback((updates: Array<() => void>) => {
    updateQueue.current.push(...updates)
    
    if (!isProcessing.current) {
      isProcessing.current = true
      
      // Process updates in next tick
      setTimeout(() => {
        while (updateQueue.current.length > 0) {
          const update = updateQueue.current.shift()
          if (update) {
            update()
          }
        }
        isProcessing.current = false
      }, 0)
    }
  }, [])

  // Debounced state update
  const debouncedUpdate = useCallback((action: any, delay: number = 300) => {
    const timeoutId = setTimeout(() => {
      dispatch(action)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [dispatch])

  // Throttled state update
  const throttledUpdate = useCallback((action: any, limit: number = 100) => {
    let inThrottle: boolean
    return () => {
      if (!inThrottle) {
        dispatch(action)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [dispatch])

  return {
    batchUpdate,
    debouncedUpdate,
    throttledUpdate
  }
}

// Hook for virtual scrolling optimization
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount + overscan, items.length)
    const startIndex = Math.max(0, start - overscan)
    
    return { start: startIndex, end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }))
  }, [items, visibleRange, itemHeight])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    containerRef,
    visibleItems,
    totalHeight,
    handleScroll
  }
}

// Hook for memoized selectors
export function useDashboardSelectors() {
  const { state } = useDashboard()

  // Memoized user info
  const userInfo = useMemo(() => {
    if (!state.user) return null
    return {
      id: state.user.id,
      name: state.user.full_name,
      email: state.user.email,
      type: state.user.user_type,
      isVerified: state.user.is_verified,
      credits: state.user.credits,
      package: state.user.package_type
    }
  }, [state.user])

  // Memoized session stats
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

  // Memoized notification stats
  const notificationStats = useMemo(() => {
    const total = state.notifications.length
    const unread = state.notifications.filter(n => !n.read).length
    const byType = state.notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      unread,
      byType,
      hasUnread: unread > 0
    }
  }, [state.notifications])

  // Memoized card states
  const cardStates = useMemo(() => {
    const statsCards = Object.values(state.cardStates.statsCards)
    const sessionCards = Object.values(state.cardStates.sessionCards)
    const quickActionCards = Object.values(state.cardStates.quickActionCards)

    return {
      statsCards: {
        total: statsCards.length,
        hovered: statsCards.filter(card => card.isHovered).length,
        loading: statsCards.filter(card => card.isLoading).length
      },
      sessionCards: {
        total: sessionCards.length,
        expanded: sessionCards.filter(card => card.isExpanded).length,
        hovered: sessionCards.filter(card => card.isHovered).length
      },
      quickActionCards: {
        total: quickActionCards.length,
        hovered: quickActionCards.filter(card => card.isHovered).length,
        pressed: quickActionCards.filter(card => card.isPressed).length
      }
    }
  }, [state.cardStates])

  return {
    userInfo,
    sessionStats,
    notificationStats,
    cardStates
  }
}

// Hook for performance monitoring and optimization
export function usePerformanceOptimization() {
  const { state } = useDashboard()
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())
  const performanceMetrics = useRef({
    averageRenderTime: 0,
    slowRenders: 0,
    memoryUsage: 0
  })

  // Track render performance
  useEffect(() => {
    const now = Date.now()
    const renderTime = now - lastRenderTime.current
    renderCount.current++

    // Update average render time
    const current = performanceMetrics.current.averageRenderTime
    const newAverage = (current * (renderCount.current - 1) + renderTime) / renderCount.current
    performanceMetrics.current.averageRenderTime = newAverage

    // Track slow renders
    if (renderTime > 16) { // Longer than one frame
      performanceMetrics.current.slowRenders++
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`)
      }
    }

    lastRenderTime.current = now
  })

  // Monitor memory usage
  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      performanceMetrics.current.memoryUsage = memory.usedJSHeapSize
    }
  })

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = []
    
    if (performanceMetrics.current.slowRenders > 5) {
      recommendations.push('Consider optimizing component re-renders')
    }
    
    if (performanceMetrics.current.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected')
    }
    
    if (state.notifications.length > 100) {
      recommendations.push('Consider limiting notification history')
    }
    
    if (state.upcomingSessions.length + state.pastSessions.length > 50) {
      recommendations.push('Consider implementing virtual scrolling for sessions')
    }

    return recommendations
  }, [state.notifications.length, state.upcomingSessions.length, state.pastSessions.length])

  return {
    metrics: performanceMetrics.current,
    recommendations: getRecommendations(),
    renderCount: renderCount.current
  }
}

// Hook for lazy loading and code splitting
export function useLazyLoading() {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set())

  const loadComponent = useCallback(async (componentName: string, importFn: () => Promise<any>) => {
    if (loadedComponents.has(componentName)) {
      return
    }

    try {
      await importFn()
      setLoadedComponents(prev => new Set(prev).add(componentName))
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error)
    }
  }, [loadedComponents])

  const isComponentLoaded = useCallback((componentName: string) => {
    return loadedComponents.has(componentName)
  }, [loadedComponents])

  return {
    loadComponent,
    isComponentLoaded,
    loadedComponents: Array.from(loadedComponents)
  }
}
