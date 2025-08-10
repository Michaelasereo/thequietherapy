"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { partnerSummary, recentActivity } from "@/lib/partner-data"
import SummaryCard from "@/components/summary-card"
import { CreditCard, Users, Calendar, TrendingUp } from "lucide-react"

export default function PartnerOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Partner Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage members, credits, and sessions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Credits Purchased"
          value={partnerSummary.totalCreditsPurchased.toString()}
          description="Credits bought for members"
          icon={CreditCard}
        />
        <SummaryCard
          title="Credits Remaining"
          value={partnerSummary.creditsRemaining.toString()}
          description="Available for distribution"
          icon={CreditCard}
        />
        <SummaryCard
          title="Active Members"
          value={partnerSummary.activeMembers.toString()}
          description="Members with active accounts"
          icon={Users}
        />
        <SummaryCard
          title="Total Sessions Booked"
          value={partnerSummary.totalSessionsBooked.toString()}
          description="Sessions completed by members"
          icon={Calendar}
        />
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


