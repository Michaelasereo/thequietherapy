'use client';

import { useEffect, useState, useCallback, memo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, Video, CheckCircle2, TrendingUp, Clock, Users, Mail, DollarSign, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Calendar, FileText, Zap, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
// Removed unused imports that were causing re-renders
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

const TherapistDashboardPage = memo(function TherapistDashboardPage() {
  console.log('🔍 TherapistDashboardPage: Component rendered')
  
  const { user } = useAuth()
  const router = useRouter()
  
  // Simplified - only keep what we actually use
  const addErrorNotification = useCallback((title: string, message: string) => {
    console.error(`${title}: ${message}`)
  }, [])

  // State for real data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const hasFetchedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  // Fetch function - no debouncing needed, just prevent duplicate calls
  const fetchDashboardData = useCallback(async (userId: string, forceRefresh = false) => {
    // Prevent duplicate calls for the same user unless force refresh
    if (currentUserIdRef.current === userId && hasFetchedRef.current && !forceRefresh) {
      return
    }

    // Prevent overlapping fetches
    if (isFetchingRef.current) {
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      hasFetchedRef.current = true
      currentUserIdRef.current = userId
      console.log('🔍 TherapistDashboardPage: Fetching dashboard data for:', userId)
      
      const response = await fetch(`/api/therapist/dashboard-data?therapistId=${userId}&t=${Date.now()}`)
      const data = await response.json()
      
      console.log('✅ TherapistDashboardPage: Dashboard data loaded successfully')
      console.log('🔍 TherapistDashboardPage: Sessions count:', data?.data?.sessions?.length || 0)
      
      setDashboardData(data)
    } catch (error) {
      console.error('❌ TherapistDashboardPage: Error fetching dashboard data:', error)
      addErrorNotification('Data Fetch Error', 'Failed to load dashboard data')
      hasFetchedRef.current = false // Allow retry on error
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [addErrorNotification])

  // Add refresh function
  const refreshDashboard = useCallback(() => {
    if (user?.id && !isFetchingRef.current) {
      fetchDashboardData(user.id, true)
    }
  }, [user?.id, fetchDashboardData])

  // Fetch real therapist dashboard data - SINGLE API call with duplicate prevention
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    if (!hasFetchedRef.current || currentUserIdRef.current !== user.id) {
      fetchDashboardData(user.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Auto-refresh dashboard data every 30 seconds (matching user dashboard and video-call page)
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        console.log('🔄 TherapistDashboardPage: Auto-refreshing dashboard data...')
        fetchDashboardData(user.id, true) // Force refresh
      }
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Use real data from API
  const therapist = dashboardData?.data?.therapist
  const sessions = dashboardData?.data?.sessions || []
  const clients = dashboardData?.data?.clients || 0
  
  console.log('🔍 TherapistDashboardPage: Sessions from API:', sessions.length)
  console.log('🔍 TherapistDashboardPage: Session statuses:', sessions.map((s: any) => ({ id: s.id, status: s.status, start_time: s.start_time })))

  // Use earnings from API (already calculated)
  const earningsThisMonth = therapist?.earningsThisMonth || 0

  // Dynamic data based on real therapist info
  const therapistSummaryCards = [
    {
      title: "Total Clients",
      value: therapist?.totalClients?.toString() || "0",
      description: "Active clients",
      icon: Users,
    },
    {
      title: "Sessions This Month",
      value: therapist?.totalSessions?.toString() || "0",
      description: "Completed sessions",
      icon: CheckCircle2,
    },
    {
      title: "Earnings This Month",
      value: `₦${earningsThisMonth.toLocaleString()}`,
      description: "₦5,000 per session",
      icon: DollarSign,
    },
    {
      title: "Session Rate",
      value: `₦${therapist?.hourlyRate || 5000}`,
      description: "Per session",
      icon: Clock,
    },
  ]

  // Helper function to determine session type
  const getSessionType = (session: any) => {
    if (session.is_instant) {
      return { type: 'instant', label: 'Instant Meeting', icon: Zap, color: 'bg-purple-100 text-purple-700 border-purple-200' }
    }
    if (session.created_by === 'therapist') {
      return { type: 'custom', label: 'Custom Meeting', icon: UserPlus, color: 'bg-blue-100 text-blue-700 border-blue-200' }
    }
    return { type: 'regular', label: 'Regular Meeting', icon: CalendarIcon, color: 'bg-green-100 text-green-700 border-green-200' }
  }

  // Use real session data from API - include all scheduled statuses
  const therapistUpcomingSessions = sessions.filter((s: any) => 
    s.status === 'scheduled' || 
    s.status === 'in_progress' || 
    s.status === 'confirmed' || 
    s.status === 'pending_approval'
  )
  
  console.log('🔍 TherapistDashboardPage: therapistUpcomingSessions count:', therapistUpcomingSessions.length)

  // Get all scheduled sessions (future and upcoming)
  const scheduledSessions = sessions.filter((s: any) => {
    if (!s.start_time) return false
    const sessionDate = new Date(s.start_time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sessionDate >= today && (
      s.status === 'scheduled' || 
      s.status === 'in_progress' || 
      s.status === 'confirmed' || 
      s.status === 'pending_approval'
    )
  })

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get scheduled dates for calendar highlighting
  const getScheduledDates = () => {
    const dates = new Set<string>()
    scheduledSessions.forEach((session: any) => {
      if (session.start_time) {
        const date = new Date(session.start_time)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        dates.add(dateStr)
      }
    })
    return dates
  }

  const scheduledDates = getScheduledDates()

  // Calendar helper functions
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const isDateToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isDateScheduled = (date: Date) => {
    const dateStr = formatDateForCalendar(date)
    return scheduledDates.has(dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = isDateToday(currentDate)
      const isScheduled = isDateScheduled(currentDate)
      const dayNumber = currentDate.getDate()
      
      // Get sessions for this date
      const dateStr = formatDateForCalendar(currentDate)
      const daySessions = scheduledSessions.filter((s: any) => {
        if (!s.start_time) return false
        const sessionDateStr = formatDateForCalendar(new Date(s.start_time))
        return sessionDateStr === dateStr
      })
      
      days.push(
        <button
          key={i}
          type="button"
          disabled
          className={`
            relative h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center
            ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
            ${isToday && isCurrentMonth ? 'ring-2 ring-brand-gold' : ''}
            ${isScheduled && isCurrentMonth ? 'bg-brand-gold/20 border-2 border-brand-gold' : ''}
            ${!isScheduled && isCurrentMonth ? 'hover:bg-gray-50' : ''}
            cursor-default
          `}
          title={daySessions.length > 0 ? `${daySessions.length} session(s) scheduled` : ''}
        >
          {dayNumber}
          {isToday && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-gold rounded-full"></div>
          )}
          {isScheduled && !isToday && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-brand-gold rounded-full"></div>
          )}
        </button>
      )
    }
    
    return days
  }

  const format = (date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSessionStatusChange = (sessionId: string, newStatus: string) => {
    // Update local state
    // ... existing session update logic ...

    // Broadcast to other dashboards (simplified)
    console.log(`Session ${sessionId} status changed to ${newStatus}`);

    // Add notification (simplified)
    console.log('Session Updated:', `Session status changed to ${newStatus}`);
  };

  // Get user's display name early for loading state
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Therapist'

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, <span className="text-brand-gold">{displayName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {therapist?.specialization && Array.isArray(therapist.specialization) && therapist.specialization.length > 0 
              ? therapist.specialization.join(' • ') 
              : 'Licensed Therapist'
            }
            {therapist?.licenseNumber && ` • License: ${therapist.licenseNumber}`}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshDashboard}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pending Approval Banner */}
      {therapist?.is_pending && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Application Pending Approval</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Your therapist enrollment is under review by our admin team. You can explore your dashboard, but you won't be able to set availability or accept sessions until your application is approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {therapistSummaryCards.map((card, index) => (
          <Card key={index} className="cursor-pointer transition-all duration-200 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className="h-8 w-8 text-muted-foreground">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Sessions and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {therapistUpcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {therapistUpcomingSessions.map((session: any) => {
                  const sessionType = getSessionType(session)
                  const SessionTypeIcon = sessionType.icon
                  const isInProgress = session.status === 'in_progress'
                  
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <CalendarIcon className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {session.users?.full_name || 'Client'}
                              </h4>
                              <Badge variant="outline" className={`text-xs ${sessionType.color}`}>
                                <SessionTypeIcon className="h-3 w-3 mr-1" />
                                {sessionType.label}
                              </Badge>
                              {isInProgress && (
                                <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 capitalize">{session.status}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isInProgress ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              router.push(`/video-session/${session.id}`)
                            }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Video Call
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              router.push(`/therapist/dashboard/video-call?sessionId=${session.id}`)
                            }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            View Session
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="font-semibold text-lg">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-gold/20 border border-brand-gold"></div>
                  <span className="text-xs text-muted-foreground">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full ring-2 ring-brand-gold"></div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Quick Stats */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Week's Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Scheduled</p>
                <p className="text-2xl font-bold">{scheduledSessions.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-brand-gold" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{therapist?.totalClients || 0}</p>
              </div>
              <Users className="h-8 w-8 text-brand-gold" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/therapist/dashboard/create-session')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Create New Session
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/therapist/dashboard/availability')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = '/therapist/dashboard/client-sessions'}
            >
              <FileText className="h-4 w-4 mr-2" />
              View All Sessions
            </Button>
          </CardContent>
        </Card>

        {/* Recent Clients or Tips */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Next Session</p>
              {therapistUpcomingSessions.length > 0 ? (
                <p className="text-xs text-blue-700 mt-1">
                  {therapistUpcomingSessions[0]?.users?.full_name || 'Client'} on{' '}
                  {new Date(therapistUpcomingSessions[0]?.start_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              ) : (
                <p className="text-xs text-blue-700 mt-1">No upcoming sessions</p>
              )}
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">This Month</p>
              <p className="text-xs text-green-700 mt-1">
                {therapist?.totalSessions || 0} sessions • ₦{earningsThisMonth.toLocaleString()} earned
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
})

export default TherapistDashboardPage
