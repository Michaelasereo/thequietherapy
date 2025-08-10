"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminSummary, recentActivities, pendingVerifications, platformStats, revenueData, systemHealth } from "@/lib/admin-data"
import SummaryCard from "@/components/summary-card"
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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Users"
          value={adminSummary.totalUsers.toString()}
          description="Registered platform users"
          icon={Users}
        />
        <SummaryCard
          title="Therapists"
          value={adminSummary.totalTherapists.toString()}
          description="Verified therapists"
          icon={UserCheck}
        />
        <SummaryCard
          title="Partners"
          value={adminSummary.totalPartners.toString()}
          description="Partner institutions"
          icon={Building2}
        />
        <SummaryCard
          title="Total Sessions"
          value={adminSummary.totalSessions.toString()}
          description="Completed sessions"
          icon={Calendar}
        />
      </div>

      {/* Second Row Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Pending Verifications"
          value={adminSummary.pendingVerifications.toString()}
          description="Awaiting approval"
          icon={AlertTriangle}
        />
        <SummaryCard
          title="Monthly Revenue"
          value={`₦${(adminSummary.totalRevenue / 1000000).toFixed(1)}M`}
          description="Total platform revenue"
          icon={DollarSign}
        />
        <SummaryCard
          title="Active Sessions"
          value={adminSummary.activeSessions.toString()}
          description="Currently ongoing"
          icon={Activity}
        />
        <SummaryCard
          title="Platform Health"
          value={adminSummary.platformHealth}
          description="System status"
          icon={Shield}
        />
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
                <div className="text-2xl font-bold">{systemHealth.uptime}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Response Time</div>
                <div className="text-2xl font-bold">{systemHealth.responseTime}ms</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Error Rate</div>
                <div className="text-2xl font-bold">{systemHealth.errorRate}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Server Load</div>
                <div className="text-2xl font-bold">{systemHealth.serverLoad}%</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Health</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {systemHealth.databaseHealth}
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
