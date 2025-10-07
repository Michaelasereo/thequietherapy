import { createServerClient } from '@/lib/supabase'

export interface FundraisingStats {
  raised: number
  donors: number
  target: number
  daysLeft: number
  averageDonation: number
  progressPercentage: number
  recentDonations: Array<{
    amount: number
    donor_name: string
    created_at: string
    email_masked: string
  }>
}

export interface DonationStatsResponse {
  success: boolean
  data: FundraisingStats
  cached: boolean
  timestamp: number
}

/**
 * Fetch live donation statistics from the API
 */
export async function getLiveDonationStats(): Promise<FundraisingStats> {
  try {
    const response = await fetch('/api/donations/stats', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const result: DonationStatsResponse = await response.json()
    
    if (!result.success) {
      throw new Error('API returned error')
    }

    return result.data
  } catch (error) {
    console.error('❌ Error fetching live donation stats:', error)
    
    // Return fallback data if API fails
    return {
      raised: 0, // No donations yet
      donors: 0,
      target: 120000000,
      daysLeft: 45,
      averageDonation: 0,
      progressPercentage: 0, // No progress yet
      recentDonations: []
    }
  }
}

/**
 * Calculate donation impact based on amount
 */
export function calculateDonationImpact(amount: number): string {
  if (amount >= 100000) {
    return "Supports multiple students for a month of therapy"
  } else if (amount >= 50000) {
    return "Provides therapy for a student for a month"
  } else if (amount >= 25000) {
    return "Supports a student for a week of therapy"
  } else if (amount >= 10000) {
    return "Provides two therapy sessions"
  } else if (amount >= 5000) {
    return "Funds one therapy session"
  } else {
    return "Contributes to our therapy fund"
  }
}

/**
 * Format currency for Nigerian Naira
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Check if stats are fresh (less than 5 minutes old)
 */
export function isStatsFresh(timestamp: number): boolean {
  return Date.now() - timestamp < 5 * 60 * 1000 // 5 minutes
}
