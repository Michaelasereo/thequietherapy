'use client';

import { useEffect, useState } from 'react';
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
import { useRouter } from 'next/navigation';
// Data fetching functions moved to API routes

export default function AdminDashboardPage() {
  const { adminInfo, userStats, systemHealth, revenueStats, fetchAdminData, fetchSystemUsers, fetchSystemStats, fetchSystemSettings } = useAdminData();
  const { addSystemAlert } = useAdminNotificationState();
  const { broadcastSystemAlert } = useCrossDashboardBroadcast();
  const router = useRouter();

  // State for real data
  const [adminSummary, setAdminSummary] = useState({
    totalUsers: 0,
    totalTherapists: 0,
    totalPartners: 0,
    totalSessions: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    activeSessions: 0,
    platformHealth: "Unknown"
  });
  const [recentActivities, setRecentActivities] = useState<Array<{id: string, user: string, time: string, type: string}>>([]);
  const [pendingVerifications, setPendingVerifications] = useState<Array<{id: string, name: string, email: string, submitted: string, type: string}>>([]);
  const [platformStats, setPlatformStats] = useState({
    dailyActiveUsers: 0,
    sessionCompletionRate: 0,
    userSatisfactionScore: 0,
    therapistRetentionRate: 0
  });
  const [revenueData, setRevenueData] = useState({
    monthlyRevenue: 0,
    growthRate: 0,
    topRevenueSources: [] as Array<{source: string, amount: number}>
  });
  const [localSystemHealth, setLocalSystemHealth] = useState({
    uptime: 99.9,
    responseTime: 245,
    errorRate: 0.1,
    serverLoad: 65,
    databaseHealth: "Optimal"
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel using API routes
        const [
          summaryResponse,
          activitiesResponse,
          verificationsResponse,
          statsResponse,
          revenueResponse,
          healthResponse
        ] = await Promise.all([
          fetch('/api/admin/summary'),
          fetch('/api/admin/recent-activities'),
          fetch('/api/admin/pending-verifications'),
          fetch('/api/admin/platform-stats'),
          fetch('/api/admin/revenue-data'),
          fetch('/api/admin/system-health')
        ]);

        const summaryData = await summaryResponse.json();
        const activitiesData = await activitiesResponse.json();
        const verificationsData = await verificationsResponse.json();
        const statsData = await statsResponse.json();
        const revenueDataResult = await revenueResponse.json();
        const healthData = await healthResponse.json();

        setAdminSummary(summaryData);
        setRecentActivities(activitiesData);
        setPendingVerifications(verificationsData);
        setPlatformStats(statsData);
        setRevenueData(revenueDataResult);
        setLocalSystemHealth(healthData);

      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        addSystemAlert('Data Fetch Error', 'Failed to load dashboard data', 'high');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addSystemAlert]);

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

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading platform data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered platform users</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalTherapists.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Verified therapists</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalPartners.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Partner institutions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Completed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminSummary.pendingVerifications.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{adminSummary.activeSessions.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{platformStats.dailyActiveUsers.toLocaleString()}</div>
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
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
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
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Verifications
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/dashboard/therapists')}
              >
                View Therapists
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/dashboard/partners')}
              >
                View Partners
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingVerifications.length > 0 ? (
              pendingVerifications.map((verification) => (
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
                    <Button 
                      size="sm" 
                      onClick={() => router.push(verification.type === 'therapist' ? '/admin/dashboard/therapists' : '/admin/dashboard/partners')}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No pending verifications
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                {revenueData.topRevenueSources.length > 0 ? (
                  revenueData.topRevenueSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{source.source}</span>
                      <span className="text-sm font-medium">₦{source.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No revenue data available</div>
                )}
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
