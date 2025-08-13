"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useCardState, useSessionState } from '@/hooks/useDashboardState'
import { cn } from '@/lib/utils'

interface StatefulCardProps {
  cardId: string
  cardType: 'stats' | 'session' | 'quickAction'
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  title?: string
  description?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  interactive?: boolean
  loading?: boolean
  expanded?: boolean
  showHoverEffect?: boolean
}

export function StatefulCard({
  cardId,
  cardType,
  children,
  className,
  header,
  footer,
  title,
  description,
  onClick,
  onMouseEnter,
  onMouseLeave,
  interactive = false,
  loading = false,
  expanded = false,
  showHoverEffect = true,
  ...props
}: StatefulCardProps) {
  const { getStatsCardState, getSessionCardState, getQuickActionCardState, setCardHover } = useCardState()

  // Get card state based on type
  const getCardState = () => {
    switch (cardType) {
      case 'stats':
        try {
          return getStatsCardState(cardId as any)
        } catch {
          return { isHovered: false, isLoading: false }
        }
      case 'session':
        return getSessionCardState(cardId)
      case 'quickAction':
        try {
          return getQuickActionCardState(cardId as any)
        } catch {
          return { isHovered: false, isLoading: false }
        }
      default:
        return { isHovered: false, isLoading: false }
    }
  }

  const cardState = getCardState()

  // Update loading state
  React.useEffect(() => {
    if (cardType === 'stats' && 'isLoading' in cardState && loading !== cardState.isLoading) {
      // Update stats card loading state
      // This would need to be implemented in the context
    }
  }, [loading, cardState, cardType])

  const handleMouseEnter = () => {
    if (showHoverEffect) {
      setCardHover(cardType, cardId, true)
    }
    onMouseEnter?.()
  }

  const handleMouseLeave = () => {
    if (showHoverEffect) {
      setCardHover(cardType, cardId, false)
    }
    onMouseLeave?.()
  }

  const handleClick = () => {
    if (interactive && onClick) {
      onClick()
    }
  }

  const isHovered = cardState.isHovered
  const isLoading = ('isLoading' in cardState && cardState.isLoading) || loading

  return (
    <Card
      className={cn(
        className,
        interactive && 'cursor-pointer transition-all duration-200',
        isHovered && showHoverEffect && 'shadow-lg scale-[1.02]',
        expanded && 'ring-2 ring-primary/20',
        isLoading && 'opacity-75'
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {header && <CardHeader>{header}</CardHeader>}
      
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className={cn(isLoading && 'animate-pulse')}>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          children
        )}
      </CardContent>
      
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

// Stats Card variant
interface StatefulStatsCardProps {
  cardId: keyof ReturnType<typeof useCardState>['getStatsCardState']
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  className?: string
  onClick?: () => void
}

export function StatefulStatsCard({
  cardId,
  title,
  value,
  description,
  icon,
  trend,
  loading = false,
  className,
  onClick,
  ...props
}: StatefulStatsCardProps) {
  const { getStatsCardState, setStatsCardState } = useCardState()
  const cardState = getStatsCardState(cardId)

  React.useEffect(() => {
    if (loading !== cardState.isLoading) {
      setStatsCardState(cardId, { isLoading: loading })
    }
  }, [loading, cardState.isLoading, cardId, setStatsCardState])

  return (
    <StatefulCard
      cardId={cardId}
      cardType="stats"
      className={cn(className)}
      onClick={onClick}
      interactive={!!onClick}
      loading={loading}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">
            {loading ? '...' : value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              <span className={cn(
                'font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </StatefulCard>
  )
}

// Session Card variant
interface StatefulSessionCardProps {
  sessionId: string
  title: string
  date: string
  time: string
  therapist: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  children?: React.ReactNode
  className?: string
  onExpand?: () => void
  onReschedule?: () => void
  onCancel?: () => void
}

export function StatefulSessionCard({
  sessionId,
  title,
  date,
  time,
  therapist,
  status,
  children,
  className,
  onExpand,
  onReschedule,
  onCancel,
  ...props
}: StatefulSessionCardProps) {
  const { getSessionState, toggleSessionExpansion } = useSessionState()
  const sessionState = getSessionState(sessionId)

  const handleExpand = () => {
    toggleSessionExpansion(sessionId)
    onExpand?.()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      case 'no-show':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <StatefulCard
      cardId={sessionId}
      cardType="session"
      className={cn(className)}
      onClick={handleExpand}
      interactive={true}
      expanded={sessionState.isExpanded}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {date} at {time}
          </p>
          <p className="text-sm text-muted-foreground">
            with {therapist}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getStatusColor(status)
          )}>
            {status}
          </span>
        </div>
      </div>
      
      {sessionState.isExpanded && children && (
        <div className="mt-4 pt-4 border-t">
          {children}
        </div>
      )}
    </StatefulCard>
  )
}
