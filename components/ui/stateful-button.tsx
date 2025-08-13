"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useButtonState } from '@/hooks/useDashboardState'
import { cn } from '@/lib/utils'

interface StatefulButtonProps {
  buttonId: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  tooltip?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
}

export function StatefulButton({
  buttonId,
  variant = 'default',
  size = 'default',
  children,
  onClick,
  disabled = false,
  loading = false,
  className,
  icon,
  iconPosition = 'left',
  tooltip,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}: StatefulButtonProps) {
  const {
    getPrimaryButtonState,
    setButtonLoading,
    setButtonDisabled,
    setButtonPressed,
    setIconButtonHover,
    setIconButtonActive
  } = useButtonState()

  const buttonState = getPrimaryButtonState(buttonId)
  const isIconButton = size === 'icon'

  // Update button state based on props
  React.useEffect(() => {
    if (loading !== buttonState.isLoading) {
      setButtonLoading(buttonId, loading)
    }
    if (disabled !== buttonState.isDisabled) {
      setButtonDisabled(buttonId, disabled)
    }
  }, [loading, disabled, buttonState.isLoading, buttonState.isDisabled, buttonId, setButtonLoading, setButtonDisabled])

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  const handleMouseEnter = () => {
    if (isIconButton) {
      setIconButtonHover(buttonId, true)
    }
    onMouseEnter?.()
  }

  const handleMouseLeave = () => {
    if (isIconButton) {
      setIconButtonHover(buttonId, false)
    }
    onMouseLeave?.()
  }

  const handleMouseDown = () => {
    if (isIconButton) {
      setIconButtonActive(buttonId, true)
    } else {
      setButtonPressed(buttonId, true)
    }
    onMouseDown?.()
  }

  const handleMouseUp = () => {
    if (isIconButton) {
      setIconButtonActive(buttonId, false)
    } else {
      setButtonPressed(buttonId, false)
    }
    onMouseUp?.()
  }

  const isPressed = buttonState.isPressed || (isIconButton && buttonState.isActive)
  const isHovered = isIconButton ? buttonState.isHovered : false

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={cn(
        className,
        isPressed && 'scale-95',
        isHovered && 'shadow-md',
        loading && 'cursor-wait',
        disabled && 'cursor-not-allowed'
      )}
      title={tooltip}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </Button>
  )
}

// Icon Button variant
interface StatefulIconButtonProps {
  buttonId: string
  icon: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  tooltip?: string
  active?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
}

export function StatefulIconButton({
  buttonId,
  icon,
  variant = 'ghost',
  size = 'default',
  onClick,
  disabled = false,
  loading = false,
  className,
  tooltip,
  active = false,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}: StatefulIconButtonProps) {
  const {
    getIconButtonState,
    setIconButtonHover,
    setIconButtonActive
  } = useButtonState()

  const buttonState = getIconButtonState(buttonId)

  // Update active state
  React.useEffect(() => {
    if (active !== buttonState.isActive) {
      setIconButtonActive(buttonId, active)
    }
  }, [active, buttonState.isActive, buttonId, setIconButtonActive])

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  const handleMouseEnter = () => {
    setIconButtonHover(buttonId, true)
    onMouseEnter?.()
  }

  const handleMouseLeave = () => {
    setIconButtonHover(buttonId, false)
    onMouseLeave?.()
  }

  const handleMouseDown = () => {
    setIconButtonActive(buttonId, true)
    onMouseDown?.()
  }

  const handleMouseUp = () => {
    setIconButtonActive(buttonId, false)
    onMouseUp?.()
  }

  const isPressed = buttonState.isPressed || buttonState.isActive
  const isHovered = buttonState.isHovered

  return (
    <Button
      variant={variant}
      size="icon"
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={cn(
        className,
        isPressed && 'scale-95',
        isHovered && 'shadow-md',
        loading && 'cursor-wait',
        disabled && 'cursor-not-allowed',
        buttonState.isActive && 'bg-primary text-primary-foreground'
      )}
      title={tooltip}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
    </Button>
  )
}
