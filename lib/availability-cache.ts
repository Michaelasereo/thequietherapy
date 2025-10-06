// Availability cache invalidation system
// Ensures real-time updates when therapists change availability

interface CacheEntry {
  data: any
  timestamp: number
  therapistId: string
}

class AvailabilityCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Generate cache key
  private getCacheKey(therapistId: string, date: string, type: 'days' | 'slots'): string {
    return `${type}_${therapistId}_${date}`
  }

  // Get cached data if valid
  get(therapistId: string, date: string, type: 'days' | 'slots'): any | null {
    const key = this.getCacheKey(therapistId, date, type)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  // Set cache data
  set(therapistId: string, date: string, type: 'days' | 'slots', data: any): void {
    const key = this.getCacheKey(therapistId, date, type)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      therapistId
    })
  }

  // Invalidate all cache for a specific therapist
  invalidateTherapist(therapistId: string): void {
    console.log(`🔄 Invalidating availability cache for therapist: ${therapistId}`)
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.therapistId === therapistId) {
        this.cache.delete(key)
      }
    }
  }

  // Invalidate all cache
  invalidateAll(): void {
    console.log('🔄 Invalidating all availability cache')
    this.cache.clear()
  }

  // Get cache stats
  getStats(): { size: number, entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const availabilityCache = new AvailabilityCache()

// Helper functions for cache management
export const invalidateTherapistAvailability = (therapistId: string) => {
  availabilityCache.invalidateTherapist(therapistId)
}

export const invalidateAllAvailability = () => {
  availabilityCache.invalidateAll()
}

// API endpoint to invalidate cache (for therapist dashboard)
export const handleAvailabilityChange = (therapistId: string) => {
  console.log(`📅 Therapist ${therapistId} changed availability - invalidating cache`)
  invalidateTherapistAvailability(therapistId)
  
  // TODO: Send real-time update to connected users
  // This could be WebSocket or Server-Sent Events
}
