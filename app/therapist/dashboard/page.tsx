'use client';

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Video, CheckCircle2, TrendingUp, Clock, Users, Mail, DollarSign } from "lucide-react"
import { useTherapistData, useTherapistButtonState, useTherapistNotificationState } from "@/hooks/useTherapistDashboardState"
import { useCrossDashboardBroadcast } from '@/hooks/useCrossDashboardSync';
import { StatefulButton } from "@/components/ui/stateful-button"
import { useTherapistUser } from "@/context/therapist-user-context"

export default function TherapistDashboardPage() {
  console.log('🔍 TherapistDashboardPage: Component rendered')
  
  const { therapistUser } = useTherapistUser()
  const { therapistInfo, sessionStats, clientStats, fetchTherapistData, fetchClients, fetchSessions, fetchStats } = useTherapistData()
  const { getPrimaryButtonState, setButtonLoading } = useTherapistButtonState()
  const { addSuccessNotification, addErrorNotification } = useTherapistNotificationState()
  const { broadcastSessionStatusChange } = useCrossDashboardBroadcast();

  // State for real data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real therapist dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!therapistUser?.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/therapist/dashboard-data?therapistId=${therapistUser.id}`)
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching therapist dashboard data:', error)
        addErrorNotification('Data Fetch Error', 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [therapistUser?.id, addErrorNotification])

  // Fetch therapist data on component mount
  useEffect(() => {
    console.log('🔍 TherapistDashboardPage: Fetching therapist data...')
    fetchTherapistData()
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    fetchSessions()
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    fetchClients()
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    fetchStats()
  }, []) // Empty dependency array to run only once

  // Use real data from API
  const therapist = dashboardData?.therapist
  const sessions = dashboardData?.sessions || []
  const clients = dashboardData?.clients || 0

  // Calculate earnings this month (₦5,000 per session)
  const earningsThisMonth = (therapist?.completedSessions || 0) * 5000

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
  const therapistUpcomingSessions = sessions.filter((s: any) => s.status === 'scheduled')

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

    // Broadcast to other dashboards
    broadcastSessionStatusChange(sessionId, newStatus, 'therapist');

    // Add notification
    addSuccessNotification('Session Updated', `Session status changed to ${newStatus}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Therapist Dashboard</h1>
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
      {/* Email Verification Banner - Show if not verified */}
      {!therapist?.isVerified && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">Email Verification Required</h3>
                <p className="text-sm text-orange-700">
                  Please check your email and click the verification link to complete your account setup.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Unverified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Approval Banner - Show if verified but not approved */}
      {therapist?.isVerified && !therapist?.isApproved && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Waiting for Admin Approval</h3>
                <p className="text-sm text-yellow-700">
                  Your account has been verified! We're currently reviewing your application. 
                  You'll be able to set availability and accept clients once approved.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Approval
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fully Approved Banner - Show when verified and approved */}
      {therapist?.isVerified && therapist?.isApproved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-800">Account Fully Approved!</h3>
                <p className="text-sm text-green-700">
                  Your therapist account has been approved and activated. You can now set availability and accept clients.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Approved
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {therapist?.name || 'Therapist'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {therapist?.specialization && Array.isArray(therapist.specialization) && therapist.specialization.length > 0 
            ? therapist.specialization.join(' • ') 
            : 'Licensed Therapist'
          }
          {therapist?.licenseNumber && ` • License: ${therapist.licenseNumber}`}
        </p>
      </div>

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
                          <h4 className="font-medium text-gray-900">Session #{session.id}</h4>
                          <p className="text-sm text-gray-600">{session.status}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Details
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notifications & Important Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>• Reminder: Your profile review is due by September 30th.</p>
            <p>• New feature: Enhanced client notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
