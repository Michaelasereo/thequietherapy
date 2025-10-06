"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTherapistUser } from "@/context/therapist-user-context"
import { getTherapistDashboardData } from "@/lib/therapist-data"

export default function TherapistEarningsPage() {
  const { therapistUser } = useTherapistUser()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!therapistUser?.id) return

      try {
        setLoading(true)
        const data = await getTherapistDashboardData(therapistUser.id)
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching earnings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEarningsData()
  }, [therapistUser?.id])

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

  const earnings = dashboardData?.earnings || { thisMonth: 0, total: 0, transactions: [] }
  const mtd = `₦${earnings.thisMonth.toLocaleString()}`

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Earnings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mtd}</div>
            <p className="text-muted-foreground">Based on completed sessions this month.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{earnings.total.toLocaleString()}</div>
            <p className="text-muted-foreground">All time earnings from completed sessions.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.therapist?.completedSessions || 0}</div>
            <p className="text-muted-foreground">Total completed sessions.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right text-green-600">
                      +₦{t.amount.toLocaleString()}
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


