'use client';

import { useEffect, useState, useCallback, memo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, Video, CheckCircle2, TrendingUp, Clock, Users, Mail, DollarSign, RefreshCw, AlertTriangle } from "lucide-react"
// Removed unused imports that were causing re-renders
import { useAuth } from "@/context/auth-context"

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
  
  // Simplified - only keep what we actually use
  const addErrorNotification = useCallback((title: string, message: string) => {
    console.error(`${title}: ${message}`)
  }, [])

  // State for real data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const hasFetchedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  // Fetch function - no debouncing needed, just prevent duplicate calls
  const fetchDashboardData = useCallback(async (userId: string, forceRefresh = false) => {
    // Prevent duplicate calls for the same user unless force refresh
    if (currentUserIdRef.current === userId && hasFetchedRef.current && !forceRefresh) {
      console.log('🔍 TherapistDashboardPage: Skipping duplicate fetch for:', userId)
      return
    }

    try {
      setLoading(true)
      hasFetchedRef.current = true
      currentUserIdRef.current = userId
      console.log('🔍 TherapistDashboardPage: Fetching dashboard data for:', userId)
      
      const response = await fetch(`/api/therapist/dashboard-data?therapistId=${userId}&t=${Date.now()}`)
      const data = await response.json()
      setDashboardData(data)
      
      console.log('✅ TherapistDashboardPage: Dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ TherapistDashboardPage: Error fetching dashboard data:', error)
      addErrorNotification('Data Fetch Error', 'Failed to load dashboard data')
      hasFetchedRef.current = false // Allow retry on error
    } finally {
      setLoading(false)
    }
  }, [addErrorNotification])

  // Add refresh function
  const refreshDashboard = useCallback(() => {
    if (user?.id) {
      fetchDashboardData(user.id, true)
    }
  }, [user?.id, fetchDashboardData])

  // Fetch real therapist dashboard data - SINGLE API call with duplicate prevention
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    fetchDashboardData(user.id)
  }, [user?.id, fetchDashboardData])

  // Use real data from API
  const therapist = dashboardData?.data?.therapist
  const sessions = dashboardData?.data?.sessions || []
  const clients = dashboardData?.data?.clients || 0

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

  // Use real session data from API
  const therapistUpcomingSessions = sessions.filter((s: any) => s.status === 'scheduled' || s.status === 'in_progress')

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
            Welcome back, {displayName}
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
                {therapistUpcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {session.users?.full_name || 'Client'} - Session #{session.id}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">{session.status}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Navigate to session or join session
                          window.location.href = `/therapist/dashboard/video-call?sessionId=${session.id}`
                        }}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="text-muted-foreground">Calendar component</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications / Important Updates section */}
      <Card className="shadow-sm bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-50 flex items-center justify-center text-xs font-bold mr-3">i</div>
            Notifications & Important Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-slate-700">
            <p className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>Reminder: Your profile review is due by September 30th.</span>
            </p>
            <p className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>New feature: Enhanced client notes are now available.</span>
            </p>
            <p className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</span>
            </p>
            {therapist?.is_pending && (
              <p className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span>Your therapist application is under review. You'll receive an email once approved.</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default TherapistDashboardPage
