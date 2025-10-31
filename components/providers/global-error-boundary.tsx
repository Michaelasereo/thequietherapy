'use client'

/**
 * Global Error Boundary
 * 
 * Catches all unhandled errors in the React component tree
 * and logs them for monitoring and debugging.
 * 
 * Features:
 * - Catches React render errors
 * - Catches unhandled promise rejections
 * - Logs to error tracking API
 * - Shows user-friendly error UI
 * - Provides error recovery options
 */

import { useEffect, useState, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
}

interface GlobalErrorBoundaryProps {
  children: ReactNode
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    // Handle runtime errors
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global Error Caught:', event.error)
      
      const errorInfo: ErrorInfo = {
        message: event.error?.message || event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      }

      setError(errorInfo)
      setErrorCount(prev => prev + 1)

      // Log to error tracking service
      logError({
        type: 'runtime_error',
        message: errorInfo.message,
        stack: errorInfo.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: errorInfo.timestamp
      })

      // Prevent default browser error handling
      event.preventDefault()
    }

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason)
      
      const errorInfo: ErrorInfo = {
        message: `Promise Rejection: ${event.reason?.message || String(event.reason)}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      }

      setError(errorInfo)
      setErrorCount(prev => prev + 1)

      // Log to error tracking service
      logError({
        type: 'promise_rejection',
        message: errorInfo.message,
        stack: errorInfo.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: errorInfo.timestamp
      })

      // Prevent default rejection handling
      event.preventDefault()
    }

    // Add event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Auto-recover from frequent errors (potential infinite loop)
  useEffect(() => {
    if (errorCount > 5) {
      console.warn('⚠️ Too many errors detected, attempting auto-recovery')
      setTimeout(() => {
        setError(null)
        setErrorCount(0)
      }, 5000)
    }
  }, [errorCount])

  // If error occurred, show error UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
                <CardDescription>
                  An unexpected error occurred. Our team has been notified.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <Alert variant="destructive">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <p className="font-semibold mb-2">{error.message}</p>
                  {error.stack && (
                    <pre className="text-xs overflow-auto max-h-40 bg-black/10 p-2 rounded mt-2">
                      {error.stack}
                    </pre>
                  )}
                  <p className="text-xs mt-2 text-muted-foreground">
                    Time: {new Date(error.timestamp).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Production-friendly error message */}
            {process.env.NODE_ENV === 'production' && (
              <Alert>
                <AlertDescription>
                  We're sorry for the inconvenience. Please try one of the options below.
                </AlertDescription>
              </Alert>
            )}

            {/* Recovery options */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={() => {
                  setError(null)
                  setErrorCount(0)
                }}
                className="flex-1"
                variant="outline"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1"
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Support information */}
            <div className="text-sm text-muted-foreground text-center pt-4 border-t">
              <p>
                If this problem persists, please contact support at{' '}
                <a href="mailto:support@thequietherapy.com" className="underline">
                  support@thequietherapy.com
                </a>
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-2 text-xs">
                  Error #{errorCount} | Session: {error.timestamp}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No error, render children normally
  return <>{children}</>
}

/**
 * Log error to error tracking service
 */
async function logError(errorData: {
  type: string
  message: string
  stack?: string
  url: string
  userAgent: string
  timestamp: string
}) {
  try {
    // Only log in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ERROR_LOGGING === 'true') {
      await fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      })
    } else {
      console.log('📝 Error would be logged in production:', errorData)
    }
  } catch (loggingError) {
    // Don't let logging errors crash the app
    console.error('Failed to log error:', loggingError)
  }
}

/**
 * React Error Boundary Class Component
 * (For catching React component errors)
 */
import { Component, ErrorInfo as ReactErrorInfo } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ReactErrorInfo
}

export class ReactErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    console.error('🚨 React Error Boundary Caught:', error, errorInfo)

    // Log to error tracking
    logError({
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })

    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <CardTitle className="text-2xl">Component Error</CardTitle>
                  <CardDescription>
                    A component failed to render properly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant="destructive">
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription>
                    <p className="font-semibold mb-2">{this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-xs overflow-auto max-h-40 bg-black/10 p-2 rounded mt-2">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo && (
                      <pre className="text-xs overflow-auto max-h-40 bg-black/10 p-2 rounded mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={() => this.setState({ hasError: false })}
                  className="flex-1"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Combined Error Boundary (recommended usage)
 */
export function CombinedErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary>
      <GlobalErrorBoundary>
        {children}
      </GlobalErrorBoundary>
    </ReactErrorBoundary>
  )
}

