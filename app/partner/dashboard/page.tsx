'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Users, Calendar, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

export default function PartnerOverviewPage() {
  console.log('🚀 PARTNER DASHBOARD PAGE STARTED');
  console.log('🔍 Partner dashboard component rendering...');

  // State for real data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 Partner dashboard page useEffect - component mounted');
    
    // Fetch real partner dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // Get partner ID from session or context
        const response = await fetch('/api/partner/me')
        const partnerData = await response.json()
        
        if (partnerData.id) {
          const dashboardResponse = await fetch(`/api/partner/dashboard-data?partnerId=${partnerData.id}`)
          const data = await dashboardResponse.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Error fetching partner dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    console.log('✅ PARTNER DASHBOARD PAGE MOUNTED SUCCESSFULLY');
  }, []);

  // Use real data from API or fallback to defaults
  const partnerSummary = dashboardData?.summary || {
    totalCreditsPurchased: 0,
    creditsRemaining: 0,
    activeMembers: 0,
    totalSessionsBooked: 0
  }

  const recentActivity = dashboardData?.recentActivity || {
    latestMembers: [],
    latestPurchases: [],
    recentUsage: []
  }

  console.log('🔍 Partner dashboard data loaded:', { partnerSummary, recentActivity });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  try {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage members, credits, and sessions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits Purchased</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerSummary.totalCreditsPurchased}</div>
              <p className="text-xs text-muted-foreground">Credits bought for members</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerSummary.creditsRemaining}</div>
              <p className="text-xs text-muted-foreground">Available for distribution</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerSummary.activeMembers}</div>
              <p className="text-xs text-muted-foreground">Members with active accounts</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions Booked</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerSummary.totalSessionsBooked}</div>
              <p className="text-xs text-muted-foreground">Sessions completed by members</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Latest member additions</div>
                {recentActivity.latestMembers.length > 0 ? (
                  <ul className="text-sm list-disc pl-5">
                    {recentActivity.latestMembers.map((m: any) => (
                      <li key={m.id}>{m.name} — {m.email}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent member additions</p>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Latest credit purchases</div>
                {recentActivity.latestPurchases.length > 0 ? (
                  <ul className="text-sm list-disc pl-5">
                    {recentActivity.latestPurchases.map((p: any) => (
                      <li key={p.id}>
                        {new Date(p.date).toLocaleDateString()}: {p.credits} credits — ₦{p.amount.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent credit purchases</p>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Recent session usage</div>
                {recentActivity.recentUsage.length > 0 ? (
                  <ul className="text-sm list-disc pl-5">
                    {recentActivity.recentUsage.map((u: any) => (
                      <li key={u.id}>
                        {new Date(u.date).toLocaleDateString()}: {u.member} used {u.credits} credits
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent session usage</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full">Add Members</Button>
              <Button variant="outline" className="w-full">Purchase Credits</Button>
              <Button variant="outline" className="w-full">Assign Credits</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ Error rendering partner dashboard:', error);
    throw error; // Let the error boundary catch it
  }
}


