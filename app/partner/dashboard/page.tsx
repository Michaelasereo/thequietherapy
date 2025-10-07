'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Users, Calendar, TrendingUp, Clock, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function PartnerOverviewPage() {
  console.log('🚀 PARTNER DASHBOARD PAGE STARTED');
  console.log('🔍 Partner dashboard component rendering...');
  const router = useRouter();

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

  // Check if partner is under review
  const isUnderReview = dashboardData?.partner?.partner_status === 'under_review';

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
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome, {dashboardData?.partner?.full_name || dashboardData?.partner?.company_name || 'Partner'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dashboardData?.partner?.organization_type ? `${dashboardData.partner.organization_type} • ` : ''}Manage members, credits, and sessions
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Under Review Card */}
        {isUnderReview && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Clock className="h-5 w-5 mr-2" />
                Partnership Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-blue-700">
                  🎉 <strong>Welcome to the platform!</strong> Your partnership has been automatically approved and you have full access to all features while our team conducts a final review.
                </p>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">You Can Access:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ All dashboard features and navigation</li>
                    <li>✅ Add and manage members</li>
                    <li>✅ Purchase and assign credits</li>
                    <li>✅ View reports and analytics</li>
                    <li>✅ Complete partner onboarding</li>
                  </ul>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Our team will conduct a final review within 24-48 hours. You'll receive an email notification once the review is complete. Your access will continue uninterrupted.
                  </p>
                </div>
                <p className="text-sm text-blue-600">
                  <strong>Organization:</strong> {dashboardData?.partner?.company_name || 'Organization'} - {dashboardData?.partner?.organization_type || 'Organization Type'}
                </p>
                {dashboardData?.partner?.onboarding_data && (
                  <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                    <strong>Contact:</strong> {dashboardData.partner.onboarding_data.phone || 'Not provided'} | 
                    <strong> Website:</strong> {dashboardData.partner.onboarding_data.website || 'Not provided'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards Section */}
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
              <Button 
                className="w-full" 
                onClick={() => router.push('/partner/dashboard/members')}
              >
                Add Members
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/partner/dashboard/credits')}
              >
                Purchase Credits
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/partner/dashboard/members')}
              >
                Assign Credits
              </Button>
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


