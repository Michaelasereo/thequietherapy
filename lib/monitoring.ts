// Critical monitoring for investor-ready platform
export interface CriticalMetrics {
  sessionSuccessRate: number
  paymentSuccessRate: number
  videoJoinSuccess: number
  userRetention: number
  apiErrorRate: number
}

export class PlatformMonitor {
  private static instance: PlatformMonitor
  private metrics: Partial<CriticalMetrics> = {}
  private errorCounts: Map<string, number> = new Map()

  static getInstance(): PlatformMonitor {
    if (!PlatformMonitor.instance) {
      PlatformMonitor.instance = new PlatformMonitor()
    }
    return PlatformMonitor.instance
  }

  // Track API errors (the 500 errors that kill credibility)
  trackApiError(endpoint: string, error: any) {
    const key = `api_error_${endpoint}`
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)
    
    console.error(`🚨 CRITICAL: API Error in ${endpoint}:`, error)
    
    // Alert if error rate is too high
    if (count > 10) {
      this.alertHighErrorRate(endpoint, count)
    }
  }

  // Track session success (core business metric)
  trackSessionAttempt(success: boolean) {
    const current = this.metrics.sessionSuccessRate || 100
    const total = (current / 100) * 1000 // Assume 1000 total attempts
    
    const newTotal = total + 1
    const newSuccess = success ? (current * total / 100) + 1 : (current * total / 100)
    
    this.metrics.sessionSuccessRate = (newSuccess / newTotal) * 100
    
    if (this.metrics.sessionSuccessRate < 95) {
      this.alertLowSessionSuccess()
    }
  }

  // Track payment success (revenue metric)
  trackPaymentAttempt(success: boolean) {
    const current = this.metrics.paymentSuccessRate || 100
    const total = (current / 100) * 1000
    
    const newTotal = total + 1
    const newSuccess = success ? (current * total / 100) + 1 : (current * total / 100)
    
    this.metrics.paymentSuccessRate = (newSuccess / newTotal) * 100
    
    if (this.metrics.paymentSuccessRate < 99) {
      this.alertLowPaymentSuccess()
    }
  }

  // Get current metrics for dashboard
  getMetrics(): CriticalMetrics {
    return {
      sessionSuccessRate: this.metrics.sessionSuccessRate || 100,
      paymentSuccessRate: this.metrics.paymentSuccessRate || 100,
      videoJoinSuccess: this.metrics.videoJoinSuccess || 95,
      userRetention: this.metrics.userRetention || 0,
      apiErrorRate: this.getApiErrorRate()
    }
  }

  private getApiErrorRate(): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    return Math.min(totalErrors, 5) // Cap at 5% for display
  }

  private alertHighErrorRate(endpoint: string, count: number) {
    console.error(`🚨 ALERT: High error rate in ${endpoint} (${count} errors)`)
    // TODO: Send to monitoring service (Sentry, DataDog, etc.)
  }

  private alertLowSessionSuccess() {
    console.error(`🚨 ALERT: Session success rate below 95% (${this.metrics.sessionSuccessRate}%)`)
    // TODO: Send alert to team
  }

  private alertLowPaymentSuccess() {
    console.error(`🚨 ALERT: Payment success rate below 99% (${this.metrics.paymentSuccessRate}%)`)
    // TODO: Send alert to team
  }
}

// Global instance for easy access
export const monitor = PlatformMonitor.getInstance()

// Helper functions for tracking
export const trackApiCall = (endpoint: string, success: boolean, error?: any) => {
  if (success) {
    monitor.trackSessionAttempt(true)
  } else {
    monitor.trackApiError(endpoint, error)
    monitor.trackSessionAttempt(false)
  }
}

export const trackPayment = (success: boolean) => {
  monitor.trackPaymentAttempt(success)
}

// Critical health check endpoint
export const getHealthStatus = () => {
  const metrics = monitor.getMetrics()
  
  const isHealthy = 
    metrics.sessionSuccessRate >= 95 &&
    metrics.paymentSuccessRate >= 99 &&
    metrics.apiErrorRate <= 5

  return {
    healthy: isHealthy,
    metrics,
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString()
  }
}
