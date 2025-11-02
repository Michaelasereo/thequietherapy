"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/auth-context"

export default function TherapistEarningsPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/therapist/dashboard-data?therapistId=${user.id}`)
        const data = await response.json()
        setDashboardData(data?.data)
      } catch (error) {
        console.error('Error fetching earnings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEarningsData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Earnings</h2>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Use data from the API (same structure as dashboard)
  const earningsThisMonth = dashboardData?.therapist?.earningsThisMonth || 0
  const totalEarnings = dashboardData?.therapist?.totalEarnings || 0
  const completedSessions = dashboardData?.therapist?.completedSessions || 0
  const completedSessionsThisMonth = dashboardData?.therapist?.completedSessionsThisMonth || 0
  
  // Get completed sessions for transactions - sort by date (most recent first)
  const sessions = dashboardData?.sessions || []
  const completedSessionsList = sessions
    .filter((s: any) => s.status === 'completed')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.start_time || a.created_at)
      const dateB = new Date(b.start_time || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 20) // Limit to 20 most recent transactions

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Earnings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{earningsThisMonth.toLocaleString()}</div>
            <p className="text-muted-foreground">From {completedSessionsThisMonth} completed session{completedSessionsThisMonth !== 1 ? 's' : ''} this month.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{totalEarnings.toLocaleString()}</div>
            <p className="text-muted-foreground">All time earnings from {completedSessions} completed session{completedSessions !== 1 ? 's' : ''}.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedSessions}</div>
            <p className="text-muted-foreground">Total completed sessions.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {completedSessionsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessionsList.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.start_time || session.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      Session with {session.users?.full_name || 'Unknown Client'}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      +₦{(session.amount_earned || 5000).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No completed sessions yet.</p>
              <p className="text-sm">Earnings will appear here once you complete sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


