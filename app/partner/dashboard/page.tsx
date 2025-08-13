'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Users, Calendar, TrendingUp } from "lucide-react"
import { usePartnerData, usePartnerCardState, usePartnerButtonState, usePartnerNotificationState } from '@/hooks/usePartnerDashboardState';
import { useCrossDashboardBroadcast } from '@/hooks/useCrossDashboardSync';

export default function PartnerOverviewPage() {
  const { partnerInfo, memberStats, sessionStats, fetchPartnerData, fetchMembers, fetchSessions, fetchStats } = usePartnerData();
  const { addSuccessNotification, addErrorNotification } = usePartnerNotificationState();
  const { broadcastUserStatusChange } = useCrossDashboardBroadcast();

  // Default data in case imports are not available during build
  const partnerSummary = {
    totalCreditsPurchased: 5000,
    creditsRemaining: 2340,
    activeMembers: 45,
    totalSessionsBooked: 156
  }

  const recentActivity = {
    latestMembers: [
      { id: "1", name: "John Smith", email: "john@company.com" },
      { id: "2", name: "Sarah Johnson", email: "sarah@company.com" }
    ],
    latestPurchases: [
      { id: "1", date: "2024-09-15", credits: 1000, amount: 5000000 },
      { id: "2", date: "2024-09-10", credits: 500, amount: 2500000 }
    ],
    recentUsage: [
      { id: "1", date: "2024-09-15", member: "John Smith", credits: 5 },
      { id: "2", date: "2024-09-14", member: "Sarah Johnson", credits: 5 }
    ]
  }
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
              <ul className="text-sm list-disc pl-5">
                {recentActivity.latestMembers.map(m => (<li key={m.id}>{m.name} — {m.email}</li>))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Latest credit purchases</div>
              <ul className="text-sm list-disc pl-5">
                {recentActivity.latestPurchases.map(p => (<li key={p.id}>{p.date}: {p.credits} credits — ₦{p.amount.toLocaleString()}</li>))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Recent session usage</div>
              <ul className="text-sm list-disc pl-5">
                {recentActivity.recentUsage.map(u => (<li key={u.id}>{u.date}: {u.member} used {u.credits} credits</li>))}
              </ul>
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
}


