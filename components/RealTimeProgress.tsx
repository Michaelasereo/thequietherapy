"use client"

import { useState, useEffect, useCallback } from "react"
import { FundraisingProgress } from "./AnimatedProgress"
import { getLiveDonationStats, FundraisingStats } from "@/lib/donation-stats"

interface RealTimeProgressProps {
  className?: string
  pollingInterval?: number // in milliseconds, default 30 seconds
}

export function RealTimeProgress({ 
  className = "", 
  pollingInterval = 30000 
}: RealTimeProgressProps) {
  const [stats, setStats] = useState<FundraisingStats>({
    raised: 0, // No donations yet
    donors: 0,
    target: 120000000,
    daysLeft: 45,
    averageDonation: 0,
    progressPercentage: 0,
    recentDonations: []
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔄 Fetching live donation stats...')
      const liveStats = await getLiveDonationStats()
      
      console.log('📊 Received stats:', liveStats)
      
      setStats(prevStats => {
        // Only update if data has changed to prevent unnecessary re-renders
        if (
          prevStats.raised !== liveStats.raised ||
          prevStats.donors !== liveStats.donors ||
          prevStats.daysLeft !== liveStats.daysLeft
        ) {
          console.log('📊 Stats updated:', {
            raised: liveStats.raised,
            donors: liveStats.donors,
            progress: `${(liveStats.progressPercentage || 0).toFixed(1)}%`
          })
          return liveStats
        }
        return prevStats
      })
      
      setError(null)
      setLastUpdated(new Date())
      setIsLoading(false)
      
    } catch (err) {
      console.error('❌ Error fetching live stats:', err)
      setError('Failed to load latest donation data')
      setIsLoading(false)
    }
  }, [])

  // Initial fetch and polling setup
  useEffect(() => {
    fetchStats()
    
    // Set a timeout to force loading state to false after 5 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout reached, showing data')
        setIsLoading(false)
      }
    }, 5000)
    
    const interval = setInterval(fetchStats, pollingInterval)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [fetchStats, pollingInterval, isLoading])

  // Fetch stats when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchStats])

  // Show loading state only for a short time, then show data even if API fails
  if (isLoading && !error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold mb-2 animate-pulse">
            ₦0
          </div>
          <div className="text-lg text-gray-600">
            Be the first to make a difference...
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full">
          <div className="h-3 bg-blue-600 rounded-full w-0 transition-all duration-1000" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-200 rounded-lg animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2" />
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <p className="text-yellow-800 text-sm">
              Unable to load live data - showing offline mode. Donations will be tracked once the system is fully set up.
            </p>
          </div>
        </div>
      )}

      {/* Live Data Indicator */}
      {lastUpdated && !error && (
        <div className="mb-4 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">
            Live data • Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Progress Component */}
      <FundraisingProgress
        raised={stats.raised}
        target={stats.target}
        donors={stats.donors}
        daysLeft={stats.daysLeft}
        averageDonation={stats.averageDonation}
      />
    </div>
  )
}

// Hook for using donation stats in other components
export function useDonationStats(pollingInterval = 30000) {
  const [stats, setStats] = useState<FundraisingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const liveStats = await getLiveDonationStats()
      setStats(liveStats)
      setError(null)
      setIsLoading(false)
    } catch (err) {
      setError('Failed to fetch donation stats')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    const interval = setInterval(fetchStats, pollingInterval)
    
    return () => clearInterval(interval)
  }, [fetchStats, pollingInterval])

  return { stats, isLoading, error, refetch: fetchStats }
}

