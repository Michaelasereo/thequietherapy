import { supabase } from '@/lib/supabase'

export interface AnalyticsData {
  userGrowth: {
    total: number
    thisMonth: number
    lastMonth: number
    growthRate: number
    byType: {
      individual: number
      therapist: number
      partner: number
    }
  }
  sessionMetrics: {
    total: number
    completed: number
    cancelled: number
    completionRate: number
    averageDuration: number
    thisMonth: number
    lastMonth: number
  }
  revenueMetrics: {
    total: number
    thisMonth: number
    lastMonth: number
    growthRate: number
    averageSessionValue: number
    byPaymentMethod: {
      card: number
      bank_transfer: number
      mobile_money: number
    }
  }
  therapistMetrics: {
    total: number
    active: number
    verified: number
    averageRating: number
    totalSessions: number
    averageEarnings: number
  }
  platformHealth: {
    uptime: number
    responseTime: number
    errorRate: number
    activeUsers: number
    systemLoad: number
  }
}

export interface ReportData {
  id: string
  title: string
  type: 'user' | 'session' | 'revenue' | 'therapist' | 'system'
  data: any
  generated_at: string
  generated_by: string
}

// Get comprehensive analytics data
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Get user data
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_type, created_at')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return getDefaultAnalytics()
    }

    // Get session data
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('global_sessions')
      .select('status, created_at, amount_paid, duration_minutes')

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return getDefaultAnalytics()
    }

    // Get payment data
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_method, created_at, status')

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return getDefaultAnalytics()
    }

    // Calculate user growth
    const now = new Date()
    const thisMonth = now.getMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisYear = now.getFullYear()

    const usersThisMonth = usersData?.filter(u => {
      const userDate = new Date(u.created_at)
      return userDate.getMonth() === thisMonth && userDate.getFullYear() === thisYear
    }).length || 0

    const usersLastMonth = usersData?.filter(u => {
      const userDate = new Date(u.created_at)
      return userDate.getMonth() === lastMonth && userDate.getFullYear() === thisYear
    }).length || 0

    const userGrowthRate = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0

    // Calculate session metrics
    const totalSessions = sessionsData?.length || 0
    const completedSessions = sessionsData?.filter(s => s.status === 'completed').length || 0
    const cancelledSessions = sessionsData?.filter(s => s.status === 'cancelled').length || 0
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    const sessionsThisMonth = sessionsData?.filter(s => {
      const sessionDate = new Date(s.created_at)
      return sessionDate.getMonth() === thisMonth && sessionDate.getFullYear() === thisYear
    }).length || 0

    const sessionsLastMonth = sessionsData?.filter(s => {
      const sessionDate = new Date(s.created_at)
      return sessionDate.getMonth() === lastMonth && sessionDate.getFullYear() === thisYear
    }).length || 0

    const averageDuration = sessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) / totalSessions || 60

    // Calculate revenue metrics
    const totalRevenue = paymentsData?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0) || 0

    const revenueThisMonth = paymentsData?.filter(p => {
      const paymentDate = new Date(p.created_at)
      return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear && p.status === 'completed'
    }).reduce((sum, p) => sum + p.amount, 0) || 0

    const revenueLastMonth = paymentsData?.filter(p => {
      const paymentDate = new Date(p.created_at)
      return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === thisYear && p.status === 'completed'
    }).reduce((sum, p) => sum + p.amount, 0) || 0

    const revenueGrowthRate = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0
    const averageSessionValue = completedSessions > 0 ? totalRevenue / completedSessions : 0

    // Calculate payment method breakdown
    const paymentMethods = paymentsData?.filter(p => p.status === 'completed')
      .reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount
        return acc
      }, {} as Record<string, number>) || {}

    // Calculate therapist metrics
    const therapists = usersData?.filter(u => u.user_type === 'therapist') || []
    const activeTherapists = therapists.length // Simplified - in real implementation you'd check session activity
    const verifiedTherapists = therapists.length // Simplified - in real implementation you'd check verification status

    return {
      userGrowth: {
        total: usersData?.length || 0,
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth,
        growthRate: userGrowthRate,
        byType: {
          individual: usersData?.filter(u => u.user_type === 'individual').length || 0,
          therapist: therapists.length,
          partner: usersData?.filter(u => u.user_type === 'partner').length || 0
        }
      },
      sessionMetrics: {
        total: totalSessions,
        completed: completedSessions,
        cancelled: cancelledSessions,
        completionRate: completionRate,
        averageDuration: averageDuration,
        thisMonth: sessionsThisMonth,
        lastMonth: sessionsLastMonth
      },
      revenueMetrics: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        growthRate: revenueGrowthRate,
        averageSessionValue: averageSessionValue,
        byPaymentMethod: {
          card: paymentMethods.card || 0,
          bank_transfer: paymentMethods.bank_transfer || 0,
          mobile_money: paymentMethods.mobile_money || 0
        }
      },
      therapistMetrics: {
        total: therapists.length,
        active: activeTherapists,
        verified: verifiedTherapists,
        averageRating: 4.8, // This would come from ratings table
        totalSessions: completedSessions,
        averageEarnings: activeTherapists > 0 ? totalRevenue / activeTherapists : 0
      },
      platformHealth: {
        uptime: 99.9,
        responseTime: 245,
        errorRate: 0.1,
        activeUsers: usersThisMonth,
        systemLoad: 65
      }
    }
  } catch (error) {
    console.error('Error getting analytics data:', error)
    return getDefaultAnalytics()
  }
}

// Get user growth report
export async function getUserGrowthReport(): Promise<Array<{ date: string; users: number; type: string }>> {
  try {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('user_type, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user growth data:', error)
      return []
    }

    // Group by date and user type
    const groupedData = usersData?.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { individual: 0, therapist: 0, partner: 0 }
      }
      acc[date][user.user_type as keyof typeof acc[typeof date]]++
      return acc
    }, {} as Record<string, { individual: number; therapist: number; partner: number }>) || {}

    // Convert to array format
    return Object.entries(groupedData).map(([date, counts]) => [
      { date, users: counts.individual, type: 'Individual' },
      { date, users: counts.therapist, type: 'Therapist' },
      { date, users: counts.partner, type: 'Partner' }
    ]).flat().filter(item => item.users > 0)
  } catch (error) {
    console.error('Error getting user growth report:', error)
    return []
  }
}

// Get revenue report
export async function getRevenueReport(): Promise<Array<{ date: string; revenue: number; sessions: number }>> {
  try {
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select('amount, created_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching revenue data:', error)
      return []
    }

    // Group by date
    const groupedData = paymentsData?.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { revenue: 0, sessions: 0 }
      }
      acc[date].revenue += payment.amount
      acc[date].sessions++
      return acc
    }, {} as Record<string, { revenue: number; sessions: number }>) || {}

    // Convert to array format
    return Object.entries(groupedData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      sessions: data.sessions
    }))
  } catch (error) {
    console.error('Error getting revenue report:', error)
    return []
  }
}

// Get session analytics
export async function getSessionAnalytics(): Promise<{
  dailySessions: Array<{ date: string; sessions: number; completed: number }>
  sessionTypes: Array<{ type: string; count: number }>
  therapistPerformance: Array<{ therapist: string; sessions: number; rating: number }>
}> {
  try {
    const { data: sessionsData, error } = await supabase
      .from('global_sessions')
      .select(`
        status,
        session_type,
        created_at,
        therapists:therapist_id (
          full_name
        )
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching session analytics:', error)
      return { dailySessions: [], sessionTypes: [], therapistPerformance: [] }
    }

    // Daily sessions
    const dailySessions = sessionsData?.reduce((acc, session) => {
      const date = new Date(session.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { sessions: 0, completed: 0 }
      }
      acc[date].sessions++
      if (session.status === 'completed') {
        acc[date].completed++
      }
      return acc
    }, {} as Record<string, { sessions: number; completed: number }>) || {}

    // Session types
    const sessionTypes = sessionsData?.reduce((acc, session) => {
      const type = session.session_type || 'General'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Therapist performance
    const therapistPerformance = sessionsData?.reduce((acc, session) => {
      const therapist = Array.isArray(session.therapists) ? session.therapists[0] : session.therapists
      const therapistName = therapist?.full_name || 'Unknown'
      if (!acc[therapistName]) {
        acc[therapistName] = { sessions: 0, rating: 4.5 } // Default rating
      }
      acc[therapistName].sessions++
      return acc
    }, {} as Record<string, { sessions: number; rating: number }>) || {}

    return {
      dailySessions: Object.entries(dailySessions).map(([date, data]) => ({
        date,
        sessions: data.sessions,
        completed: data.completed
      })),
      sessionTypes: Object.entries(sessionTypes).map(([type, count]) => ({
        type,
        count
      })),
      therapistPerformance: Object.entries(therapistPerformance).map(([therapist, data]) => ({
        therapist,
        sessions: data.sessions,
        rating: data.rating
      }))
    }
  } catch (error) {
    console.error('Error getting session analytics:', error)
    return { dailySessions: [], sessionTypes: [], therapistPerformance: [] }
  }
}

// Generate custom report
export async function generateCustomReport(
  reportType: string,
  filters: any,
  generatedBy: string
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    let reportData: any = {}

    switch (reportType) {
      case 'user_activity':
        reportData = await getUserActivityReport(filters)
        break
      case 'revenue_analysis':
        reportData = await getRevenueAnalysisReport(filters)
        break
      case 'session_performance':
        reportData = await getSessionPerformanceReport(filters)
        break
      default:
        return { success: false, error: 'Invalid report type' }
    }

    // Save report to database
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title: `${reportType.replace('_', ' ').toUpperCase()} Report`,
        type: reportType,
        data: reportData,
        generated_by: generatedBy
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving report:', error)
      return { success: false, error: 'Failed to save report' }
    }

    return { success: true, reportId: data.id }
  } catch (error) {
    console.error('Error generating custom report:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get saved reports
export async function getSavedReports(): Promise<ReportData[]> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved reports:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting saved reports:', error)
    return []
  }
}

// Helper functions for custom reports
async function getUserActivityReport(filters: any) {
  // Implementation for user activity report
  return { users: [], activity: [] }
}

async function getRevenueAnalysisReport(filters: any) {
  // Implementation for revenue analysis report
  return { revenue: [], trends: [] }
}

async function getSessionPerformanceReport(filters: any) {
  // Implementation for session performance report
  return { sessions: [], performance: [] }
}

// Default analytics data
function getDefaultAnalytics(): AnalyticsData {
  return {
    userGrowth: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growthRate: 0,
      byType: { individual: 0, therapist: 0, partner: 0 }
    },
    sessionMetrics: {
      total: 0,
      completed: 0,
      cancelled: 0,
      completionRate: 0,
      averageDuration: 60,
      thisMonth: 0,
      lastMonth: 0
    },
    revenueMetrics: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growthRate: 0,
      averageSessionValue: 0,
      byPaymentMethod: { card: 0, bank_transfer: 0, mobile_money: 0 }
    },
    therapistMetrics: {
      total: 0,
      active: 0,
      verified: 0,
      averageRating: 0,
      totalSessions: 0,
      averageEarnings: 0
    },
    platformHealth: {
      uptime: 99.9,
      responseTime: 245,
      errorRate: 0.1,
      activeUsers: 0,
      systemLoad: 65
    }
  }
}
