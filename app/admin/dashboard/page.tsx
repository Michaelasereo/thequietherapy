'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  UserCheck, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Shield
} from "lucide-react"
import { useAdminData, useAdminCardState, useAdminButtonState, useAdminNotificationState } from '@/hooks/useAdminDashboardState';
import { useCrossDashboardBroadcast } from '@/hooks/useCrossDashboardSync';

export default function AdminDashboardPage() {
  const { adminInfo, userStats, systemHealth, revenueStats, fetchAdminData, fetchSystemUsers, fetchSystemStats, fetchSystemSettings } = useAdminData();
  const { addSystemAlert } = useAdminNotificationState();
  const { broadcastSystemAlert } = useCrossDashboardBroadcast();

  // Default data in case imports are not available during build
  const adminSummary = {
    totalUsers: 1247,
    totalTherapists: 89,
    totalPartners: 23,
    totalSessions: 3456,
    pendingVerifications: 12,
    totalRevenue: 45000000,
    activeSessions: 45,
    platformHealth: "Healthy"
  }

  const recentActivities = [
    {
      id: "1",
      user: "Dr. Sarah Johnson",
      time: "2 minutes ago",
      type: "session_completed"
    },
    {
      id: "2", 
      user: "Partner Corp",
      time: "5 minutes ago",
      type: "credits_purchased"
    },
    {
      id: "3",
      user: "John Doe",
      time: "10 minutes ago", 
      type: "account_created"
    }
  ]

  const pendingVerifications = [
    {
      id: "v1",
      name: "Dr. Emily White",
      email: "emily.white@example.com",
      submitted: "2024-09-15",
      type: "Therapist"
    },
    {
      id: "v2",
      name: "Health Corp",
      email: "admin@healthcorp.com", 
      submitted: "2024-09-14",
      type: "Partner"
    }
  ]

  const platformStats = {
    dailyActiveUsers: 234,
    sessionCompletionRate: 94,
    userSatisfactionScore: 4.8,
    therapistRetentionRate: 87
  }

  const revenueData = {
    monthlyRevenue: 4500000,
    growthRate: 12.5,
    topRevenueSources: [
      { source: "Individual Sessions", amount: 2800000 },
      { source: "Partner Subscriptions", amount: 1200000 },
      { source: "Premium Features", amount: 500000 }
    ]
  }

  const localSystemHealth = {
    uptime: 99.9,
    responseTime: 245,
    errorRate: 0.1,
    serverLoad: 65,
    databaseHealth: "Optimal"
  }

  const handleSystemMaintenance = (maintenanceMode: boolean) => {
    // Update local state
    // ... existing maintenance update logic ...

    // Broadcast to all dashboards
    broadcastSystemAlert(
      {
        type: maintenanceMode ? 'maintenance_started' : 'maintenance_ended',
        message: maintenanceMode ? 'System maintenance has started' : 'System maintenance has ended'
      },
      'admin'
    );

    // Add notification
    addSystemAlert(
      'System Maintenance',
      maintenanceMode ? 'Maintenance mode activated' : 'Maintenance mode deactivated',
      'medium'
    );
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered platform users</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalTherapists}</div>
            <p className="text-xs text-muted-foreground">Verified therapists</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalPartners}</div>
            <p className="text-xs text-muted-foreground">Partner institutions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Completed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(adminSummary.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Total platform revenue</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.platformHealth}</div>
            <p className="text-xs text-muted-foreground">System status</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Statistics */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Daily Active Users</div>
                <div className="text-2xl font-bold">{platformStats.dailyActiveUsers}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Session Completion Rate</div>
                <div className="text-2xl font-bold">{platformStats.sessionCompletionRate}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">User Satisfaction</div>
                <div className="text-2xl font-bold">{platformStats.userSatisfactionScore}/5.0</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Therapist Retention</div>
                <div className="text-2xl font-bold">{platformStats.therapistRetentionRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <div className="text-sm font-medium">{activity.user}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingVerifications.map((verification) => (
                <div key={verification.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <div className="font-medium">{verification.name}</div>
                    <div className="text-sm text-muted-foreground">{verification.email}</div>
                    <div className="text-xs text-muted-foreground">Submitted: {verification.submitted}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {verification.type}
                    </Badge>
                    <Button size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="text-2xl font-bold">{localSystemHealth.uptime}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Response Time</div>
                <div className="text-2xl font-bold">{localSystemHealth.responseTime}ms</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Error Rate</div>
                <div className="text-2xl font-bold">{localSystemHealth.errorRate}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Server Load</div>
                <div className="text-2xl font-bold">{localSystemHealth.serverLoad}%</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Health</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {localSystemHealth.databaseHealth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              <div className="text-3xl font-bold">₦{revenueData.monthlyRevenue.toLocaleString()}</div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                +{revenueData.growthRate}% from last month
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Revenue Sources</div>
              <div className="space-y-2">
                {revenueData.topRevenueSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{source.source}</span>
                    <span className="text-sm font-medium">₦{source.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Quick Actions</div>
              <div className="space-y-2">
                <Button size="sm" className="w-full">View Detailed Reports</Button>
                <Button size="sm" variant="outline" className="w-full">Export Data</Button>
                <Button size="sm" variant="outline" className="w-full">Generate Invoice</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
