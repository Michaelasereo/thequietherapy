import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/server-auth'
import { getTherapistDashboardData } from '@/lib/optimized-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, DollarSign, Clock, CheckCircle } from 'lucide-react'

// This is now a Server Component - no useState, useEffect, or client-side loading!
export default async function OptimizedTherapistDashboardPage() {
  // Authentication happens on the server
  const session = await requireAuth(['therapist'])
  
  // Data fetching happens on the server with optimized single query
  const dashboardData = await getTherapistDashboardData(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {dashboardData.therapist.name}!</h1>
          <p className="text-muted-foreground">
            Here's your therapy practice overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={dashboardData.therapist.isVerified ? "default" : "secondary"}>
            {dashboardData.therapist.isVerified ? "Verified" : "Pending Verification"}
          </Badge>
          {dashboardData.therapist.isApproved && (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.therapist.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Unique clients served
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.therapist.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.therapist.completedSessions} completed, {dashboardData.therapist.upcomingSessions} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{dashboardData.therapist.earningsThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {dashboardData.therapist.completedSessions} completed sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{dashboardData.therapist.hourlyRate.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per session rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.recentSessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions yet</p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleDateString()} at{' '}
                      {new Date(session.start_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <Badge variant={
                    session.status === 'completed' ? 'default' :
                    session.status === 'scheduled' ? 'secondary' :
                    session.status === 'cancelled' ? 'destructive' : 'outline'
                  }>
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Therapist Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Specializations</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {dashboardData.therapist.specialization.length === 0 ? (
                <p className="text-muted-foreground">No specializations set</p>
              ) : (
                dashboardData.therapist.specialization.map((spec, index) => (
                  <Badge key={index} variant="outline">
                    {spec}
                  </Badge>
                ))
              )}
            </div>
          </div>
          
          {dashboardData.therapist.licenseNumber && (
            <div>
              <h4 className="font-medium">License Number</h4>
              <p className="text-muted-foreground">{dashboardData.therapist.licenseNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// This component handles client-side interactivity if needed
'use client'
function InteractiveSessionActions({ sessionId }: { sessionId: string }) {
  const handleJoinSession = () => {
    // Client-side navigation or actions
    window.location.href = `/video-session/${sessionId}`
  }

  return (
    <button 
      onClick={handleJoinSession}
      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
    >
      Join Session
    </button>
  )
}
