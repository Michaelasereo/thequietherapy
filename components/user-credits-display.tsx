"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Clock, Plus, Gift, Zap } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface UserCredits {
  total_credits: number
  free_credits: number
  paid_credits: number
  free_duration: number
  paid_duration: number
}

interface AvailableCredit {
  credit_id: string
  session_duration_minutes: number
  is_free_credit: boolean
  expires_at: string | null
}

interface UserCreditsDisplayProps {
  className?: string
  showPurchaseButton?: boolean
}

export function UserCreditsDisplay({ className = "", showPurchaseButton = true }: UserCreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [availableCredits, setAvailableCredits] = useState<AvailableCredit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserCredits() // Always fetch on mount
    
    // Listen for payment completion events
    const handlePaymentCompleted = () => {
      console.log('🔄 UserCreditsDisplay: Payment completed, refreshing credits...')
      fetchUserCredits()
    }
    
    // Listen for page visibility changes (user returns from payment)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 UserCreditsDisplay: Page visible, refreshing credits...')
        fetchUserCredits()
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('paymentCompleted', handlePaymentCompleted)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Periodic refresh (every 30 seconds) to prevent stale data
      const interval = setInterval(() => {
        fetchUserCredits()
      }, 30000)
      
      return () => {
        window.removeEventListener('paymentCompleted', handlePaymentCompleted)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        clearInterval(interval)
      }
    }
  }, []) // Only run on mount

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
        setAvailableCredits(data.available_credits || [])
      } else {
        throw new Error('Failed to fetch credits')
      }

    } catch (error) {
      console.error('Error fetching user credits:', error)
      toast({
        title: "Error",
        description: "Failed to load your session credits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!credits) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Unable to load credit information</p>
          <Button onClick={fetchUserCredits} variant="outline" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasCredits = credits.total_credits > 0
  const nextSessionDuration = availableCredits[0]?.session_duration_minutes || 0
  const isNextSessionFree = availableCredits[0]?.is_free_credit || false

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Coins className="w-5 h-5 mr-2 text-yellow-500" />
          Session Credits
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {hasCredits ? (
          <div className="space-y-4">
            {/* Main Credit Display */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {credits.total_credits}
              </div>
              <div className="text-sm text-gray-600">
                session{credits.total_credits !== 1 ? 's' : ''} remaining
              </div>
            </div>

            {/* Next Session Info */}
            {nextSessionDuration > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-900" />
                  <span className="text-sm font-medium">Next Session:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isNextSessionFree ? "secondary" : "default"}>
                    {nextSessionDuration} min
                  </Badge>
                  {isNextSessionFree && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Gift className="w-3 h-3 mr-1" />
                      Free
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Credit Breakdown */}
            {(credits.free_credits > 0 || credits.paid_credits > 0) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {credits.free_credits > 0 && (
                  <div className="text-center p-2 bg-green-50 rounded border">
                    <div className="font-semibold text-green-700">{credits.free_credits}</div>
                    <div className="text-green-600">Free ({credits.free_duration}min)</div>
                  </div>
                )}
                {credits.paid_credits > 0 && (
                  <div className="text-center p-2 bg-gray-50 rounded border">
                    <div className="font-semibold text-gray-900">{credits.paid_credits}</div>
                    <div className="text-gray-700">Paid ({credits.paid_duration}min)</div>
                  </div>
                )}
              </div>
            )}

            {/* Purchase More Button */}
            {showPurchaseButton && (
              <Link href="/dashboard/continue-journey">
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Get More Sessions
                </Button>
              </Link>
            )}
          </div>
        ) : (
          /* No Credits State */
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Coins className="w-8 h-8 text-gray-400" />
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">No Sessions Available</h3>
            <p className="text-sm text-gray-500 mb-4">
              You don't have any session credits. Purchase a package to start booking therapy sessions.
            </p>
            
            {showPurchaseButton && (
              <Link href="/dashboard/continue-journey">
                <Button className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Session Package
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Credits Never Expire Note */}
        {hasCredits && (
          <div className="mt-4 text-xs text-center text-gray-500">
            💡 Your credits never expire
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function CompactCreditsDisplay({ className = "" }: { className?: string }) {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/user/credits', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setCredits(data.credits)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!credits) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-medium">
        {credits.total_credits} session{credits.total_credits !== 1 ? 's' : ''}
      </span>
      {credits.free_credits > 0 && (
        <Badge variant="secondary" className="text-xs">
          {credits.free_credits} free
        </Badge>
      )}
    </div>
  )
}
