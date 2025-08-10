"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Activity, Target, PieChart, LineChart } from "lucide-react"

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: 1250,
    totalTherapists: 45,
    totalPartners: 28,
    totalSessions: 3450,
    totalRevenue: 2500000,
    activeSessions: 23,
    platformHealth: "Excellent",
    userSatisfaction: 4.8
  },
  growth: {
    userGrowth: 15.2,
    therapistGrowth: 8.5,
    sessionGrowth: 22.1,
    revenueGrowth: 18.7
  },
  monthlyData: [
    { month: "Jan", users: 1200, sessions: 3200, revenue: 2400000 },
    { month: "Feb", users: 1250, sessions: 3450, revenue: 2500000 },
    { month: "Mar", users: 1300, sessions: 3700, revenue: 2600000 },
    { month: "Apr", users: 1350, sessions: 3950, revenue: 2700000 },
    { month: "May", users: 1400, sessions: 4200, revenue: 2800000 },
    { month: "Jun", users: 1450, sessions: 4450, revenue: 2900000 }
  ],
  topTherapists: [
    { name: "Dr. Sarah Johnson", sessions: 45, rating: 4.8, earnings: 225000 },
    { name: "Dr. Emily White", sessions: 67, rating: 4.9, earnings: 335000 },
    { name: "Dr. Lisa Chen", sessions: 34, rating: 4.5, earnings: 170000 },
    { name: "Dr. Michael Brown", sessions: 23, rating: 4.6, earnings: 115000 },
    { name: "Dr. David Wilson", sessions: 18, rating: 4.7, earnings: 90000 }
  ],
  topPartners: [
    { name: "EduCare Foundation", members: 67, sessions: 156, revenue: 900000 },
    { name: "TechCorp Solutions", members: 45, sessions: 89, revenue: 450000 },
    { name: "Future Leaders Academy", members: 34, sessions: 67, revenue: 425000 },
    { name: "HealthCorp Ltd", members: 23, sessions: 34, revenue: 180000 },
    { name: "Wellness Clinic", members: 12, sessions: 8, revenue: 45000 }
  ],
  sessionTypes: [
    { type: "Cognitive Behavioral Therapy", sessions: 1200, percentage: 35 },
    { type: "Family Therapy", sessions: 800, percentage: 23 },
    { type: "Trauma Therapy", sessions: 600, percentage: 17 },
    { type: "Anxiety & Depression", sessions: 500, percentage: 14 },
    { type: "Child Psychology", sessions: 350, percentage: 10 }
  ],
  userDemographics: [
    { age: "18-25", users: 300, percentage: 24 },
    { age: "26-35", users: 450, percentage: 36 },
    { age: "36-45", users: 350, percentage: 28 },
    { age: "46-55", users: 120, percentage: 10 },
    { age: "55+", users: 30, percentage: 2 }
  ]
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{mockAnalytics.growth.userGrowth}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalSessions}</div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{mockAnalytics.growth.sessionGrowth}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{(mockAnalytics.overview.totalRevenue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{mockAnalytics.growth.revenueGrowth}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{mockAnalytics.overview.userSatisfaction}</div>
                <div className="text-sm text-muted-foreground">User Satisfaction</div>
                <div className="text-xs text-green-600">★★★★★</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.monthlyData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{data.users}</div>
                          <div className="text-xs text-muted-foreground">users</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{data.sessions}</div>
                          <div className="text-xs text-muted-foreground">sessions</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">₦{(data.revenue / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-muted-foreground">revenue</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Session Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.sessionTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <span className="text-sm">{type.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{type.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Performing Therapists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.topTherapists.map((therapist, index) => (
                    <div key={therapist.name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{therapist.name}</div>
                          <div className="text-sm text-muted-foreground">{therapist.sessions} sessions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{therapist.earnings.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{therapist.rating} ★</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Revenue Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.topPartners.map((partner, index) => (
                    <div key={partner.name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-muted-foreground">{partner.members} members</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{partner.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{partner.sessions} sessions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.userDemographics.map((demo) => (
                    <div key={demo.age} className="flex items-center justify-between">
                      <span className="text-sm">{demo.age}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${demo.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{demo.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Platform Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Uptime</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">99.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response Time</span>
                    <span className="text-sm font-medium">245ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="text-sm font-medium">0.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="text-sm font-medium">{mockAnalytics.overview.activeSessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Health</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Optimal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Individual Sessions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "48%" }}></div>
                      </div>
                      <span className="text-sm font-medium">48%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Partner Subscriptions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "32%" }}></div>
                      </div>
                      <span className="text-sm font-medium">32%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Premium Features</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "12%" }}></div>
                      </div>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: "8%" }}></div>
                      </div>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Growth Rate</span>
                    <span className="text-sm font-medium text-green-600">+{mockAnalytics.growth.revenueGrowth}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Session Value</span>
                    <span className="text-sm font-medium">₦5,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Lifetime Value</span>
                    <span className="text-sm font-medium">₦25,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Churn Rate</span>
                    <span className="text-sm font-medium text-red-600">2.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="text-sm font-medium text-green-600">15.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
